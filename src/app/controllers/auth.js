const { generateRefreshToken, generateAccessToken } = require("../../utils/generateToken");
const { userModel, refreshTokenModel } = require("../models");
const bcrypt = require("bcrypt");

const MAX_LENGTH_USERNAME = 256;
const MIN_LENGTH_USERNAME = 0;
const MAX_LENGTH_PW = 256;
const MIN_LENGTH_PW = 0;
const saltRounds = 10;
class Auth {
    async login(req, res) {
        try {
            const { username = "", password = "" } = req.body;

            if (
                username.includes(" ") ||
                username.length === MIN_LENGTH_USERNAME ||
                username.length > MAX_LENGTH_USERNAME
            ) {
                return res.status(403).json({
                    title: "Error",
                    message: "Invalid username",
                });
            }

            if (password.length === MIN_LENGTH_PW || password.length > MAX_LENGTH_PW)
                return res.status(403).json({
                    title: "Error",
                    message: "Invalid password",
                });

            let user = await userModel.findOne({ USERNAME: username });
            if (!user) {
                return res.status(403).json({
                    title: "Error",
                    message: "Username or password is not correct",
                });
            }

            const isMatchPW = await bcrypt.compare(password, user.PASSWORD);
            if (!isMatchPW) {
                return res.status(403).json({
                    title: "Error",
                    message: "Username or password is not correct",
                });
            }

            // create tokens
            const refreshToken = generateRefreshToken({ USERNAME: user.USER_ID, PASSWORD: user.PASSWORD });
            const accessToken = generateAccessToken({ USERNAME: user.USER_ID, PASSWORD: user.PASSWORD });

            // update refresh token for new user
            const newRefreshToken = new refreshTokenModel({ REFRESH_TOKEN_VALUE: refreshToken, USER_ID: user.USER_ID });
            newRefreshToken.save();

            // save refresh token as cookie
            res.cookie("refresh-token", refreshToken, {
                httpOnly: true,
                secure: true,
                path: "/",
                sameSite: "strict",
                expires: new Date(Date.now() + 30 * 24 * 3600000), // 30 days
            });

            const { USERNAME, PASSWORD, FIRST_NAME, MIDDLE_INITIAL, LAST_NAME, GENDER, PHONE_NUMBER, EMAIL } = user;
            return res.status(200).json({
                title: "Success",
                user: { USERNAME, PASSWORD, FIRST_NAME, MIDDLE_INITIAL, LAST_NAME, GENDER, PHONE_NUMBER, EMAIL },
                token: accessToken,
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }
    async register(req, res) {
        try {
            const {
                username = "",
                password = "",
                fistName,
                middleName,
                lastName,
                gender,
                phoneNumber,
                email,
            } = req.body;

            const hasExistEmail = await userModel.findOne({ USERNAME: username });
            if (hasExistEmail) {
                return res.status(403).json({
                    title: "Error",
                    message: "Email already exists",
                });
            }
            const hashPassword = await bcrypt.hash(password, saltRounds);

            const newUser = new userModel({
                USERNAME: username,
                PASSWORD: hashPassword,
                FIRST_NAME: fistName,
                MIDDLE_INITIAL: middleName,
                LAST_NAME: lastName,
                GENDER: gender,
                PHONE_NUMBER: phoneNumber,
                EMAIL: email,
            });

            await newUser.save();

            return res.status(200).json({
                title: "Success",
                message: "User created successfully",
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }
    async logout(req, res) {
        try {
            const refreshToken = req.cookies["refresh-token"];
            if (!refreshToken) {
                return res.status(401).json({
                    title: "Error",
                    message: "Unauthenticated 1",
                });
            }
            const { USER_ID } = req.user;
            const hasExistedToken = await refreshTokenModel.findOneAndDelete({
                USER_ID,
                REFRESH_TOKEN_VALUE: refreshToken,
            });
            if (!!!hasExistedToken) {
                return res.status(401).json({
                    title: "Error",
                    message: "Unauthenticated 2",
                });
            }
            res.clearCookie("refresh-token");

            res.status(200).json({ title: "Success", message: "Log out successfully" });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies["refresh-token"];
            const { userId } = req.params;

            if (!refreshToken) {
                return res.status(403).json({
                    title: "Error",
                    message: "Unauthenticated 1",
                });
            }

            const hasExistedToken = await refreshTokenModel.findOne({
                USER_ID: userId,
                REFRESH_TOKEN_VALUE: refreshToken,
            });

            if (!hasExistedToken) {
                return res.status(403).json({
                    title: "Error",
                    message: "Unauthenticated 2",
                });
            }

            jwt.verify(refreshToken, process.env.REFRESH_TOKEN, async (err, user) => {
                if (err)
                    return res.status(401).json({
                        title: "Error",
                        message: "Unauthenticated 3",
                    });

                const { USER_ID, EMAIL } = user;

                const newRefreshToken = generateRefreshToken({ USER_ID, EMAIL });
                const accessToken = generateAccessToken({ USER_ID, EMAIL });

                await refreshToken.create({ USER_ID: user.USER_ID, REFRESH_TOKEN_VALUE: newRefreshToken });

                res.cookie("refresh-token", newRefreshToken, {
                    maxAge: 1000 * 60 * 60 * 24 * 30,
                    httpOnly: true,
                    secure: true,
                });

                res.status(200).json({ title: "Success", token: accessToken });
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }
}

module.exports = new Auth();
