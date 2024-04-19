const express = require("express");
const router = express.Router();
const alert = require("../app/controllers/alert");

router.get("/", alert.getHiring);
router.get("/vacation", alert.getVacationDate);

module.exports = router;
