const jwt = require("jsonwebtoken");

const generateToken = (id, secret, expiresIn) =>
  jwt.sign({ id }, secret, { expiresIn });

const generateAccessToken = (id) =>
  generateToken(id, process.env.SECRET_KEY, "15m");

const generateRefreshToken = (id) =>
  generateToken(id, process.env.REFRESH_SECRET_KEY, "1h");

module.exports = { generateAccessToken, generateRefreshToken };
