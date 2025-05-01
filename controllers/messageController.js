const { User, ChatSession, Message, Character } = require("../models/models");
const ApiError = require("../error/ApiError");
const { encode, decode } = require("gpt-tokenizer");

class MessageController {
  constructor() {
    this.sendMessage = this.sendMessage.bind(this);
    this.tokenizeMessage = this.tokenizeMessage.bind(this);
    this.updateContextHistory = this.updateContextHistory.bind(this);
    this.decodeTokens = this.decodeTokens.bind(this);
    this.formatDialogHistory = this.formatDialogHistory.bind(this);
  }

  tokenizeMessage(message) {
    return encode(message);
  }

  async updateContextHistory(chatSession, newMessage, role) {
    try {
      let currentHistory = chatSession.context_history || [];
      const messageWithRole = `${role}: ${newMessage}`;
      const tokenizedMessage = this.tokenizeMessage(messageWithRole);

      currentHistory = [...currentHistory, ...tokenizedMessage];

      await chatSession.update({
        context_history: currentHistory,
        last_message_at: new Date(),
      });

      return currentHistory;
    } catch (error) {
      console.error("Ошибка при обновлении истории контекста:", error);
      throw error;
    }
  }

  async formatDialogHistory(chatSessionId) {
    try {
      const messages = await Message.findAll({
        where: { chat_session_id: chatSessionId },
        order: [["createdAt", "ASC"]],
      });

      let dialogHistory = messages
        .map((msg) => {
          const role = msg.sender_type === "MODEL" ? "MODEL" : "USER";
          return `${role}: ${msg.content}`;
        })
        .join("\n");

      return dialogHistory;
    } catch (error) {
      console.error("Ошибка при форматировании истории диалога:", error);
      throw error;
    }
  }

  async sendMessage(req, res, next) {
    const { chat_session_id, content, sender_type, tokens_used, character_id } =
      req.body;
    const userId = req.user.id;

    try {
      const chatSession = await ChatSession.findOne({
        where: { id: chat_session_id, user_id: userId },
      });

      const settings = await Character.findOne({
        where: { id: character_id },
      });

      if (!chatSession) {
        return next(
          ApiError.badRequest("У вас нет чат-сессии с этим персонажем")
        );
      }

      const userMessage = await Message.create({
        user_id: userId,
        character_id: character_id,
        chat_session_id: chat_session_id,
        content: content,
        sender_type: sender_type,
        tokens_used: tokens_used,
      });

      await this.updateContextHistory(chatSession, content, "USER");

      const dialogHistory = await this.formatDialogHistory(chat_session_id);

      const finalPrompt = `${dialogHistory}\nHuman: ${content}\nAssistant:`;

      const fullSystemPrompt = settings
        ? `${process.env.BASE_SYSTEM_PROMPT}\n${settings.settings}`
        : process.env.BASE_SYSTEM_PROMPT;

      const response = await fetch("http://localhost:9117/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mannix/llama3.1-8b-abliterated",
          prompt: finalPrompt,
          stream: false,
          system: fullSystemPrompt,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      const aiResponse = await response.json();
      const aiMessageContent = aiResponse.response;

      const aiMessage = await Message.create({
        user_id: userId,
        character_id: character_id,
        chat_session_id: chat_session_id,
        content: aiMessageContent,
        sender_type: "MODEL",
        tokens_used: aiResponse.tokens_used || 0,
      });

      await this.updateContextHistory(chatSession, aiMessageContent, "MODEL");

      return res.json({
        aiMessage,
      });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      return next(ApiError.internal("Ошибка при отправке сообщения"));
    }
  }

  decodeTokens(tokens) {
    return decode(tokens);
  }

  async getMessages(req, res, next) {
    const { chat_session_id, character_id } = req.body;
    const userId = req.user.id;

    try {
      const messages = await Message.findAll({
        where: {
          chat_session_id: chat_session_id,
          user_id: userId,
          character_id: character_id,
        },
      });
      // messages.forEach((mes) => console.log(mes.content));

      return res.json(messages);
    } catch (error) {
      console.error("Ошибка при получении сообщения:", error);
      return next(ApiError.internal("Ошибка при получении сообщения"));
    }
  }
}

const messageController = new MessageController();
module.exports = messageController;
