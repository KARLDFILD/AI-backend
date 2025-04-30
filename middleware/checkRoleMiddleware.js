const jwt = require("jsonwebtoken");
const { User } = require("../models/models");

module.exports = function (requiredRole) {
  return async function (req, res, next) {
    if (req.method === "OPTIONS") {
      return next();
    }
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Пользователь не авторизован" });
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({ message: "Нет доступа" });
      }

      req.user = user;
      next();
    } catch (e) {
      res.status(401).json({ message: "Пользователь не авторизован" });
    }
  };
};
