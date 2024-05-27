const { connectSQL, connectMySQL } = require("../../db");

class employee {
    async getBenefit(req, res) {
        try {
            const conn = await connectSQL();
            const sqlString = "select BENEFIT_PLANS_ID from BENEFIT_PLANS";
            const result = await conn.request().query(sqlString);
            conn.close();
            return res.status(200).json({
                data: result.recordset,
            });
        } catch (error) {
            console.log(error.message);
        }
    }

    async getPersonal(req, res) {
        try {
            const conn = await connectSQL();
            const sqlString = "select * from PERSONAL ";
            const result = await conn.request().query(sqlString);
            conn.close();
            return res.status(200).json({
                data: result.recordset,
            });
        } catch (error) {
            console.log(error.message);
        }
    }
    async findPersonal(req, res) {
        try {
            let { personalId } = req.query;
            const conn = await connectSQL();
            const sqlString = `select * from PERSONAL where PERSONAL_ID=${personalId}`;
            const result = await conn.request().query(sqlString);
            conn.close();
            return res.status(200).json({
                data: result.recordset,
            });
        } catch (error) {
            console.log(error.message);
        }
    }
    async addPersonal(req, res) {
        try {
            const {
                firstName,
                middleName,
                lastName,
                gender,
                birthday,
                SSN,
                driverlicense,
                address1,
                address2,
                city,
                country,
                zip,
                phoneNumber,
                email,
                maritalStatus,
                ethnicity,
                shareholderStatus,
                benefitPlanID,
            } = req.body;
            const conn = await connectSQL();
            const countPersonal = await conn.request().query("select count(*) as count from PERSONAL");
            const count = countPersonal.recordset[0].count;
            const shareholderStatusParsed = shareholderStatus ? 1 : 0;

            const sqlString = `insert into PERSONAL VALUES(${count + 1},'${firstName}','${lastName}','${middleName}'
            ,CONVERT(date, '${birthday}', 23),'${SSN}','${driverlicense}','${address1}','${address2}'
            ,'${city}','${country}','${zip}','${gender}','${phoneNumber}','${email}','${maritalStatus}','${ethnicity}'
            ,${shareholderStatusParsed},${benefitPlanID}); `;
            const result = await conn.request().query(sqlString);
            conn.close();
            return res.status(200).json({
                title: "Success",
                message: "PERSONAL created successfully",
            });
        } catch (error) {
            return res.status(500).json({ title: "Error", message: error.message });
        }
    }
    async addEmployee(req, res) {
        try {
            const {
                employeeCode,
                employeeStatus,
                hireDate,
                workerCompCode,
                terminationDate,
                rehireDate,
                lastReviewDate,
                numberDay,
                personalId,
                lastName,
                firstName,
                ssn,
                payRate,
                payRateID,
                vacationDays,
                paidToDate,
                paidToLastYear,
            } = req.body;

            // parsed varchar to int
            const numberDayParsed = parseInt(numberDay, 10);
            const personalIdParsed = parseInt(personalId, 10);
            const paidToDateParsed = parseInt(paidToDate, 10);
            const paidToLastYearParsed = parseInt(paidToLastYear, 10);
            const payRateIDParsed = parseInt(payRateID, 10);
            const ssnParsed = parseInt(ssn, 10);
            const vacationDaysParsed = parseInt(vacationDays, 10);
            //employment sql server
            const conn = await connectSQL();
            const countEmployee = await conn.request().query("select count(*) as count from EMPLOYMENT");
            const count = countEmployee.recordset[0].count;
            const sqlString = `insert into EMPLOYMENT VALUES(${
                count + 1
            },'${employeeCode}','${employeeStatus}',CONVERT(date, '${hireDate}', 23),'${workerCompCode}',CONVERT(date, '${terminationDate}', 23),CONVERT(date, '${rehireDate}', 23)
            ,CONVERT(date, '${lastReviewDate}', 23),${numberDayParsed},${personalIdParsed})`;
            const result = await conn.request().query(sqlString);
            conn.close();
            //employee mysql
            const connMysql = await connectMySQL();
            const [countEmploy] = await connMysql.query("select count(*) as countEmployee from employee");
            const countStaff = countEmploy[0].countEmployee;
            const mysqlString = `insert into employee values (${
                countStaff + 1
            },'${employeeCode}','${lastName}','${firstName}',${ssnParsed},  '${payRate}', ${payRateIDParsed}, ${vacationDaysParsed}, ${paidToDateParsed}, ${paidToLastYearParsed})`;
            const resultMysql = await connMysql.query(mysqlString);
            connMysql.end();
            return res.status(200).json({
                title: "Success",
                message: "Employee created successfully",
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }

    async getEmployee(req, res) {
        try {
            const conn = await connectSQL();
            const sqlString =
                "select * from Employment inner join PERSONAL on PERSONAL.PERSONAL_ID=EMPLOYMENT.PERSONAL_ID ";
            const result = await conn.request().query(sqlString);
            conn.close();
            return res.status(200).json({
                data: result.recordset,
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }
    async getEmployeePayRoll(req, res) {
        try {
            const connMysql = await connectMySQL();
            const mysqlString = "select * from employee";
            const [resultMysql] = await connMysql.query(mysqlString);
            connMysql.end();
            return res.status(200).json({
                data: resultMysql,
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }
    async findEmployee(req, res) {
        try {
            let { employeeCode } = req.query;
            const conn = await connectSQL();
            const sqlString = `select * from Employment inner join PERSONAL on PERSONAL.PERSONAL_ID=EMPLOYMENT.PERSONAL_ID 
            where EMPLOYMENT.EMPLOYMENT_CODE='${employeeCode}'`;
            const result = await conn.request().query(sqlString);
            conn.close();
            return res.status(200).json({
                data: result.recordset,
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }

    async updateEmployee(req, res) {
        try {
            const {
                employeeCode,
                employeeStatus,
                hireDate,
                workerCompCode,
                terminationDate,
                rehireDate,
                lastReviewDate,
                numberDay,
                employeeNumber,
                payRate,
                payRateID,
                vacationDays,
                paidToDate,
                paidToLastYear,
            } = req.body;
            const conn = await connectSQL();
            const sqlString = `update EMPLOYMENT set EMPLOYMENT_STATUS='${employeeStatus}'
            ,HIRE_DATE_FOR_WORKING='${hireDate}',WORKERS_COMP_CODE='${workerCompCode}'
            ,TERMINATION_DATE='${terminationDate}',REHIRE_DATE_FOR_WORKING='${rehireDate}'
            , LAST_REVIEW_DATE='${lastReviewDate}',NUMBER_DAYS_REQUIREMENT_OF_WORKING_PER_MONTH='${numberDay}'
            where EMPLOYMENT_CODE='${employeeCode}'`;
            const result = await conn.request().query(sqlString);
            conn.close();
            const connMysql = await connectMySQL();
            const mysqlString = `update employee set \`Pay rate\`='${payRate}', \`Pay Rates_idPay Rates\`=${payRateID},
            \`Vacation Days\`=${vacationDays},\`Paid To Date\`=${paidToDate},\`Paid Last Year\`=${paidToLastYear}
            where \`Employee Number\`='${employeeNumber}'`;
            const resultMysql = await connMysql.query(mysqlString);
            connMysql.end();
            return res.status(200).json({
                title: "Success",
                message: "Employee Update successfully",
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }

    async deleteEmployee(req, res) {
        try {
            const { employee_code } = req.query;
            const conn = await connectSQL();
            const sqlString = `delete from EMPLOYMENT where EMPLOYMENT_CODE='${employee_code}'`;
            const result = await conn.request().query(sqlString);
            conn.close();
            const connMysql = await connectMySQL();
            const mysqlString = `delete from employee where \`Employee Number\`='${employee_code}'`;
            const resultMysql = await connMysql.query(mysqlString);
            connMysql.end();
            return res.status(200).json({
                title: "Success",
                message: "Employee delete successfully",
            });
        } catch (error) {
            res.status(500).json({ title: "Error", message: error.message });
        }
    }
}

module.exports = new employee();
