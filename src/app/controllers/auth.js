const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { generateRefreshToken, generateAccessToken } = require("../../utils/generateToken");
const { userModel, refreshTokenModel, userGroupModel, groupModel } = require("../models");

const { ADMIN_ROLE, HR_ROLE, PR_ROLE } = require("../../constance");

const saltRounds = 10;

function isValidUsername(username) {
    /**
     * The username must be between 3 and 16 characters long.
     * The username can only contain alphanumeric characters (letters A-Z, numbers 0-9) and underscores.
     */

    // Define the regular expression for a valid username
    const regex = /^[a-zA-Z0-9_]{4,16}$/;

    // Test the username against the regular expression
    return regex.test(username);
}

function isValidPassword(password) {
    /**
     * The password must be at least 8 characters long.
     * The password must contain at least one uppercase letter.
     * The password must contain at least one lowercase letter.
     * The password must contain at least one digit.
     * The password must contain at least one `sp`ecial character (e.g., !, @, #, $, %, ^, &, *).
     */

    // Define the regular expression for a valid username
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,256}$/;

    // Test the username against the regular expression
    return regex.test(password);
}

class Auth {
    async register(req, res) {
        try {
            const {
                username: usernamePayload = "",
                password: passwordPayload = "",
                firstName: firstNamePayload,
                middleName: middleNamePayload,
                lastName: lastNamePayload,
                gender: genderPayload,
                phoneNumber: phoneNumberPayload,
                email: emailPayload,
                role: rolePayload,
            } = req.body;

            // check username's format
            if (!isValidUsername(usernamePayload)) {
                return res.status(403).json({
                    title: "Error",
                    message: "Invalid username",
                });
            }

            // // check password's format
            if (!isValidPassword(passwordPayload))
                return res.status(403).json({
                    title: "Error",
                    message: "Invalid password",
                });

            const hasExistEmail = await userModel.findOne({ username: usernamePayload });
            if (hasExistEmail) {
                return res.status(403).json({
                    title: "Error",
                    message: "Email already exists",
                });
            }

            const hashPassword = await bcrypt.hash(passwordPayload, saltRounds);

            const newUser = new userModel({
                username: usernamePayload,
                password: hashPassword,
                first_name: firstNamePayload,
                middle_initial: middleNamePayload,
                last_name: lastNamePayload,
                gender: genderPayload,
                phone_number: phoneNumberPayload,
                email: emailPayload,
            });

            await newUser.save();

            const user = await userModel.findOne({ username: usernamePayload });

            if (
                rolePayload !== undefined &&
                rolePayload !== null &&
                [ADMIN_ROLE, HR_ROLE, PR_ROLE].includes(Number(rolePayload))
            ) {
                let group;
                if (Number(rolePayload) === ADMIN_ROLE) {
                    group = await groupModel.findOne({ group_name: "admin" });
                } else if (Number(rolePayload) === HR_ROLE) {
                    group = await groupModel.findOne({ group_name: "hr" });
                } else {
                    group = await groupModel.findOne({ group_name: "pr" });
                }
                const userGroup = new userGroupModel({ user_id: user._id, group_id: group._id });
                await userGroup.save();
            }
            return res.status(200).json({
                title: "Success",
                message: "User created successfully",
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }

    async login(req, res) {
        try {
            const { username: usernamePayload = "", password: passwordPayload = "" } = req.body;

            // check username's format
            if (!isValidUsername(usernamePayload)) {
                return res.status(403).json({
                    title: "Error",
                    message: "Invalid username",
                });
            }

            // // check password's format
            if (!isValidPassword(passwordPayload))
                return res.status(403).json({
                    title: "Error",
                    message: "Invalid password",
                });

            let user = await userModel
                .findOne({ username: usernamePayload })
                .select("username password first_name middle_initial last_name gender phone_number email");

            if (!user) {
                return res.status(403).json({
                    title: "Error",
                    message: "Username or password is not correct",
                });
            }

            const isMatchPW = await bcrypt.compare(passwordPayload, user.password);
            if (!isMatchPW) {
                return res.status(403).json({
                    title: "Error",
                    message: "Username or password is not correct",
                });
            }

            // create tokens
            const refreshToken = generateRefreshToken({ user_id: user.user_id, username: user.username });
            const accessToken = generateAccessToken({ user_id: user.user_id, username: user.username });

            // update refresh token for new user
            const newRefreshToken = new refreshTokenModel({ refresh_token_value: refreshToken, user_id: user.user_id });
            await newRefreshToken.save();

            // save refresh token as cookie
            res.cookie("refresh-token", refreshToken, {
                httpOnly: true,
                secure: true,
                path: "/",
                sameSite: "strict",
                expires: new Date(Date.now() + 30 * 24 * 3600000), // 30 days
            });

            const { _id, username, first_name, middle_initial, last_name, gender, phone_number, email } = user._doc;

            return res.status(200).json({
                title: "Success",
                user: { _id, username, first_name, middle_initial, last_name, gender, phone_number, email },
                token: accessToken,
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
            const { user_id } = req.user;
            // remove refresh token from database
            const hasExistedToken = await refreshTokenModel.findOneAndDelete({
                user_id,
                refresh_token_value: refreshToken,
            });

            if (!!!hasExistedToken) {
                return res.status(401).json({
                    title: "Error",
                    message: "Unauthenticated 2",
                });
            }

            // clear refresh-token cookie from client
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

            const hasExistedToken = await refreshTokenModel.findOneAndDelete({
                user_id: userId,
                refresh_token_value: refreshToken,
            });

            if (!hasExistedToken) {
                return res.status(403).json({
                    title: "Error",
                    message: "Unauthenticated 2",
                });
            }

            // verify refresh token is valid
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                if (err)
                    return res.status(401).json({
                        title: "Error",
                        message: "Unauthenticated 3",
                    });

                const { user_id, email } = user;

                const newRefreshToken = generateRefreshToken({ user_id, email });
                const accessToken = generateAccessToken({ user_id, email });

                // create new fresh token
                await refreshTokenModel.create({ user_id, refresh_token_value: newRefreshToken });

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
