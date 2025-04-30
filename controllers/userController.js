const bcrypt = require("bcryptjs");
const ApiError = require("../error/ApiError");
const { User } = require("../models/models");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/jwtGenerate");
const { json } = require("sequelize");

class UserController {
  async registration(req, res, next) {
    const { email, password, user_name } = req.body;
    const { avatar } = req.files;

    if (!email || !password) {
      return next(ApiError.badRequest("Некорректный email или password"));
    }

    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
      return next(
        ApiError.badRequest("Пользователь с такой почтой уже существует")
      );
    }

    const hashPassword = await bcrypt.hash(password, 5);
    const user = await User.create({
      email,
      user_name,
      password: hashPassword,
      avatar: avatar.data,
    });

    return res.json({ message: "Вы успешно зарегестрировались!" });
  }

  async login(req, res, next) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(ApiError.internal("Пользователь с таким именем не найден"));
    }

    const comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return next(ApiError.internal("Неверный пароль"));
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: "Успешная авторизация" });
  }

  async logout(req, res) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.clearCookie("accessToken", {
      secure: true,
      sameSite: "strict",
    });
    return res.json({ message: "Вы успешно вышли из системы" });
  }

  async getUser(req, res, next) {
    const id = req.user.id;
    console.log(id);

    const user = await User.findByPk(id);

    if (!user) {
      return next(ApiError.badRequest("Пользователь не найден"));
    }

    return res.json(user);
  }
}

module.exports = new UserController();
