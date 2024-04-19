const jwt = require("jsonwebtoken");

const generateAccessToken = ({ USER_ID, EMAIL }) => {
    const token = jwt.sign({ USER_ID, EMAIL }, process.env.ACCESS_TOKEN, { expiresIn: 60 });
    return token; // 60s
};

const generateRefreshToken = ({ USER_ID, EMAIL }) => {
    return jwt.sign({ USER_ID, EMAIL }, process.env.REFRESH_TOKEN, { expiresIn: "30d" });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};
