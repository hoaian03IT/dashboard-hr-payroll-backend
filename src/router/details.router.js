const detailsController = require("../app/controllers/details");
const express = require("express");
const router = express.Router();

router.get("/earnings/to-date", detailsController.getDetailEarningsToDate);
router.get("/earnings/to-last-year", detailsController.getDetailEarningsToPreviousYear);
router.get("/earnings/list", detailsController.fetchDetailEarningByList);

module.exports = router;
