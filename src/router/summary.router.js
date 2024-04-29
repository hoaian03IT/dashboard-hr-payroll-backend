const summaryController = require("../app/controllers/summary");
const express = require("express");
const router = express.Router();

router.get("/earnings-total-duration", summaryController.getTotalEarnings);
router.get("/benefit-paid", summaryController.getBenefitPaid);
router.get("/benefit-plans", summaryController.getBenefitPlanSummary);

module.exports = router;
