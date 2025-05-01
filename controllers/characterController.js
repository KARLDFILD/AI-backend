const { Character, User } = require("../models/models");
const ApiError = require("../error/ApiError");

class CharacterController {
  async createCharacter(req, res, next) {
    const { name, description, isPublic, settings } = req.body;
    const creator_id = req.user.id;

    const { character_picture } = req.files;

    try {
      const isPublicConverter = isPublic === "true";

      const character = await Character.create({
        name,
        description,
        creator_id,
        character_picture: character_picture.data,
        isPublic: isPublicConverter,
        settings: settings,
      });

      return res.json(character);
    } catch (error) {
      console.error(error);
      return next(ApiError.internal("Ошибка при создании персонажа"));
    }
  }

  async editCharacter(req, res, next) {
    const { id } = req.params;
    const { name, description, isPublic, settings, tags } = req.body;

    try {
      const character = await Character.findByPk(id);

      if (!character) {
        return next(ApiError.badRequest("Персонаж не найден"));
      }

      if (character.creator_id !== req.user.id) {
        return next(
          ApiError.forbidden("Вы не можете редактировать этого персонажа")
        );
      }

      await character.update({ name, description, isPublic, settings });

      return res.json(character);
    } catch (error) {
      return next(ApiError.internal("Ошибка при редактировании персонажа"));
    }
  }

  async getOne(req, res, next) {
    const { id } = req.body;

    try {
      const character = await Character.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ["id", "user_name"],
          },
        ],
      });

      if (!character) {
        return next(ApiError.badRequest("Персонаж не найден"));
      }

      return res.json(character);
    } catch (error) {
      return next(ApiError.internal("Ошибка при получении персонажа"));
    }
  }

  async getAll(req, res) {
    const allCharacters = await Character.findAll();
    return res.json(allCharacters);
  }

  async deleteCharacter(req, res, next) {
    const { id } = req.params;

    try {
      const character = await Character.findByPk(id);

      if (!character) {
        return next(ApiError.badRequest("Персонаж не найден"));
      }

      if (character.creator_id !== req.user.id) {
        return next(ApiError.forbidden("Вы не можете удалить этого персонажа"));
      }

      await character.destroy();
      return res.json({ message: "Персонаж успешно удалён" });
    } catch (error) {
      return next(ApiError.internal("Ошибка при удалении персонажа"));
    }
  }
}

module.exports = new CharacterController();
