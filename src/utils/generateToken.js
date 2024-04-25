const jwt = require("jsonwebtoken");

const generateAccessToken = ({ user_id, username }) => {
    const token = jwt.sign({ user_id, username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 });
    return token; // 60s
};

const generateRefreshToken = ({ user_id, username }) => {
    return jwt.sign({ user_id, username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};
