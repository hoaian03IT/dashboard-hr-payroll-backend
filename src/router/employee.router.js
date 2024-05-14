const express = require("express");
const router = express.Router();
const employee = require("../app/controllers/employee");

router.get("/groupPersonal", employee.getPersonal);
router.get("/listPersonal", employee.findPersonal);
router.post("/addPersonal", employee.addPersonal);
router.get("/employment", employee.getEmployee);
router.post("/addEmployee", employee.addEmployee);
router.post("/updateEmployee", employee.updateEmployee);
router.delete("/deleteEmployee", employee.deleteEmployee);
router.get("/listEmployee", employee.findEmployee);

module.exports = router;
