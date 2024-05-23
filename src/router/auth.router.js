const authController = require("../app/controllers/auth");
const express = require("express");
const authenticate = require("../app/middlewares/authenticate");
const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/refresh-token/:userId", authController.refreshToken);

module.exports = router;
