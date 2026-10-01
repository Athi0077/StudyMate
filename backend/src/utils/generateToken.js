const jwt = require("jsonwebtoken");

const generateToken = (userId, role, sessionVersion = 1) => {
  return jwt.sign({ userId, role, sessionVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

module.exports = generateToken;
