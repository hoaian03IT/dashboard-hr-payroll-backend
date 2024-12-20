const summaryController = require("../app/controllers/summary");
const express = require("express");
const router = express.Router();
const authenticate = require("../app/middlewares/authenticate");

router.get("/earnings/total", summaryController.getTotalEarnings);
router.get("/earnings-by", summaryController.getEarningByCategory);
router.get("/benefit-paid", summaryController.getBenefitPaid);
router.get("/benefit-paid-average", summaryController.getBenefitPaidAverage);
router.get("/benefit-plans", summaryController.getBenefitPlanSummary);
router.get("/vacation-days", summaryController.getSummaryVacationDays);
router.get("/vacation-days-by", summaryController.getVacationDayByCategories);
router.get("/personnel/total", summaryController.getTotalPersonnel);

module.exports = router;
