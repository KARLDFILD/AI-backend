const fetch = require("node-fetch");
const { User, ChatSession, Message, Character } = require("../models/models");
const ApiError = require("../error/ApiError");

class MessageController {
  constructor() {
    this.sendMessage = this.sendMessage.bind(this);
    this.updateContextHistory = this.updateContextHistory.bind(this);
    this.formatDialogHistory = this.formatDialogHistory.bind(this);
  }

  async updateContextHistory(chatSession, newMessage, role) {
    try {
      let currentHistory = chatSession.context_history || [];
      const messageWithRole = `${role}: ${newMessage}`;
      currentHistory = [...currentHistory, messageWithRole];

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

      const dialogHistory = messages.map((msg) => {
        return {
          role: msg.sender_type.toLowerCase(),
          content: msg.content,
        };
      });

      return dialogHistory;
    } catch (error) {
      console.error("Ошибка при форматировании истории диалога:", error);
      throw error;
    }
  }

  async sendMessage(req, res, next) {
    const { chat_session_id, content, sender_type, character_id } = req.body;
    const userId = req.user.id;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return next(ApiError.internal("API ключ OpenRouter не задан"));
    }

    try {
      const chatSession = await ChatSession.findOne({
        where: { id: chat_session_id, user_id: userId },
      });

      if (!chatSession) {
        return next(
          ApiError.badRequest("У вас нет чат-сессии с этим персонажем")
        );
      }

      const character = await Character.findOne({
        where: { id: character_id },
      });

      const userMessage = await Message.create({
        user_id: userId,
        character_id: character_id,
        chat_session_id: chat_session_id,
        content: content,
        sender_type: sender_type,
        tokens_used: 0,
      });

      await this.updateContextHistory(chatSession, content, "USER");

      const characterSettings = character?.settings || "";
      const dialogHistory = await this.formatDialogHistory(chat_session_id);

      const dialogAsText = dialogHistory
        .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${m.content}`)
        .join("\n");

      const fullPrompt = `${characterSettings}\n\n${dialogAsText}\nUSER: ${content}`;
      console.log(fullPrompt);

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "nousresearch/deephermes-3-mistral-24b-preview:free",
            messages: [
              {
                role: "user",
                content: fullPrompt,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка OpenRouter:", errorText);
        return next(ApiError.internal("Ошибка при обращении к модели"));
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content;

      const aiMessage = await Message.create({
        user_id: userId,
        character_id: character_id,
        chat_session_id: chat_session_id,
        content: aiContent,
        sender_type: "MODEL",
        tokens_used: 0,
      });

      await this.updateContextHistory(chatSession, aiContent, "MODEL");

      return res.json({ aiMessage });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      return next(ApiError.internal("Ошибка при отправке сообщения"));
    }
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

      return res.json(messages);
    } catch (error) {
      console.error("Ошибка при получении сообщений:", error);
      return next(ApiError.internal("Ошибка при получении сообщений"));
    }
  }
}

module.exports = new MessageController();
