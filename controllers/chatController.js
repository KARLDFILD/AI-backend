const { ChatSession, Character } = require("../models/models");
const ApiError = require("../error/ApiError");

class ChatController {
  async createChatSession(req, res, next) {
    const { characterId, context_history } = req.body;
    const userId = req.user.id;

    try {
      const character = await Character.findByPk(characterId);

      if (!character) {
        return next(ApiError.badRequest("Персонаж не найден"));
      }

      let chatSession = await ChatSession.findOne({
        where: { user_id: userId, character_id: characterId },
      });

      if (chatSession) {
        return res.json(chatSession);
      }

      chatSession = await ChatSession.create({
        user_id: userId,
        character_id: characterId,
        context_history: context_history,
      });

      return res.json(chatSession);
    } catch (error) {
      console.error("Ошибка при создании чата:", error);
      return next(ApiError.internal("Ошибка при создании чата"));
    }
  }

  async getSession(req, res, next) {
    const { character_id } = req.body;
    const userId = req.user.id;
    try {
      let chatSession = await ChatSession.findOne({
        where: { user_id: userId, character_id: character_id },
      });
      return res.json(chatSession);
    } catch (error) {
      console.error("Ошибка при получении чата:", error);
      return next(ApiError.internal("Ошибка при получении чата"));
    }
  }

  async deleteChatSession(req, res, next) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const chatSession = await ChatSession.findByPk(id);

      if (!chatSession) {
        return next(ApiError.badRequest("Сессия чата не найдена"));
      }

      if (chatSession.user_id !== userId) {
        return next(ApiError.forbidden("Вы не можете удалить эту сессию"));
      }

      await chatSession.destroy();
      return res.json({ message: "Сессия чата успешно удалена" });
    } catch (error) {
      return next(ApiError.internal("Ошибка при удалении чата"));
    }
  }
}

module.exports = new ChatController();
