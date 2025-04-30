const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/jwtGenerate");

function refresh(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return null;
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    const newAccessToken = generateAccessToken(decoded.id);
    // const newRefreshToken = generateRefreshToken(decoded.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", newAccessToken, {
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return newAccessToken;
  } catch (error) {
    return null;
  }
}

module.exports = function verifyAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Пользователь не авторизован" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Токен отсутствует" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    return next();
  } catch (error) {
    const newToken = refresh(req, res);
    if (!newToken) {
      return res.status(401).json({ message: "Требуется повторный вход" });
    }

    req.headers.authorization = `Bearer ${newToken}`;

    try {
      const newDecoded = jwt.verify(newToken, process.env.SECRET_KEY);
      req.user = newDecoded;
      next();
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Ошибка верификации нового токена" });
    }
  }
};
