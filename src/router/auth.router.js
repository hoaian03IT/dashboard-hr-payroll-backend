const authController = require("../app/controllers/auth");
const express = require("express");
const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/refresh-token/:userId", authController.refreshToken);

module.exports = router;
