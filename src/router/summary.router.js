const summaryController = require("../app/controllers/summary");
const express = require("express");
const router = express.Router();

router.get("/earnings-total-duration", summaryController.getTotalEarnings);

module.exports = router;
