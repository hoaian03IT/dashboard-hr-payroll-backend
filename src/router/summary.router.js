const summaryController = require("../app/controllers/summary");
const express = require("express");
const router = express.Router();

router.get("/earnings-total-duration", summaryController.getTotalEarnings);
router.get("/benefit-paid", summaryController.getBenefitPaid);
router.get("/benefit-plans", summaryController.getBenefitPlanSummary);
router.get("/vacation-days", summaryController.getSummaryVacationDays);
router.get("/employment-vacation-day", summaryController.getEmployeeVacationDay);
router.get("/earnings", summaryController.getSummaryEarnings);

module.exports = router;
