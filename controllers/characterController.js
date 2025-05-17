const { Character, User } = require("../models/models");
const ApiError = require("../error/ApiError");

class CharacterController {
  async createCharacter(req, res, next) {
    const { name, description, isPublic, settings } = req.body;
    const creator_id = req.user.id;

    const character_picture = req.files?.character_picture;

    if (!character_picture) {
      return next(ApiError.badRequest("Файл изображения не загружен"));
    }

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
        include: [{ model: User, attributes: ["id", "user_name"] }],
      });

      if (!character) {
        return next(ApiError.badRequest("Персонаж не найден"));
      }

      const base64Image = character.character_picture?.toString("base64");
      const contentType = "image/jpeg";

      return res.json({
        ...character.toJSON(),
        character_picture: base64Image
          ? `data:${contentType};base64,${base64Image}`
          : null,
      });
    } catch (error) {
      return next(ApiError.internal("Ошибка при получении персонажа"));
    }
  }

  async getAll(req, res, next) {
    try {
      const allCharacters = await Character.findAll({
        include: [{ model: User, attributes: ["id", "user_name"] }],
      });

      const charactersWithBase64 = allCharacters.map((char) => {
        const base64Image = char.character_picture?.toString("base64");
        const contentType = "image/jpeg";
        return {
          ...char.toJSON(),
          character_picture: base64Image
            ? `data:${contentType};base64,${base64Image}`
            : null,
        };
      });

      return res.json(charactersWithBase64);
    } catch (error) {
      return next(ApiError.internal("Ошибка при получении персонажей"));
    }
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
