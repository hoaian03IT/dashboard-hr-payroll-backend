const express = require("express");
const router = express.Router();
const alert = require("../app/controllers/alert");

router.get("/hiring", alert.getHiring);
router.get("/vacation", alert.getVacationDate);
router.get("/birthday-anniversary", alert.getBirthdayAnniversary);

module.exports = router;
