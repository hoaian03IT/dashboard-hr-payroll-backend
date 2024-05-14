const { connectSQL, connectMySQL } = require("../../db");

class employee {
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
                fistName,
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
            const sqlString = `insert into PERSONAL VALUES(${count + 1},'${fistName}','${lastName}','${middleName}'
            ,CONVERT(date, '${birthday}', 23),'${SSN}','${driverlicense}','${address1}','${address2}'
            ,'${city}','${country}','${zip}','${gender}','${phoneNumber}','${email}','${maritalStatus}','${ethnicity}'
            ,'${shareholderStatus}','${benefitPlanID}'); `;
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
                fistName,
                ssn,
                payRate,
                payRateID,
                vacationDays,
                paidToDate,
                paidToLastYear,
            } = req.body;
            //employment sql server
            const conn = await connectSQL();
            const countEmployee = await conn.request().query("select count(*) as count from EMPLOYMENT");
            const count = countEmployee.recordset[0].count;
            const sqlString = `insert into EMPLOYMENT VALUES(${
                count + 1
            },'${employeeCode}','${employeeStatus}',CONVERT(date, '${hireDate}', 23),'${workerCompCode}',CONVERT(date, '${terminationDate}', 23),CONVERT(date, '${rehireDate}', 23)
            ,CONVERT(date, '${lastReviewDate}', 23),${numberDay},${personalId})`;
            const result = await conn.request().query(sqlString);
            conn.close();
            //employee mysql
            const connMysql = await connectMySQL();
            const [countEmploy] = await connMysql.query("select count(*) as countEmployee from employee");
            const countStaff = countEmploy[0].countEmployee;
            const mysqlString = `insert into employee values (${
                countStaff + 1
            },'${employeeCode}','${lastName}','${fistName}','${ssn}',  ${payRate}, ${payRateID}, ${vacationDays}, ${paidToDate}, ${paidToLastYear})`;
            const resultMysql = await connMysql.query(mysqlString);

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
                personalId,
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
            ,PERSONAL_ID=${personalId}
            where EMPLOYMENT_CODE='${employeeCode}'`;
            const result = await conn.request().query(sqlString);
            conn.close();
            const connMysql = await connectMySQL();
            const mysqlString = `update employee set \`Pay rate\`=${payRate}, \`Pay Rates_idPay Rates\`=${payRateID},
            \`Vacation Days\`=${vacationDays},\`Paid To Date\`=${paidToDate},\`Paid To Date\`=${paidToLastYear}
            where \`Employee Number\`=${employee_code}`;
            const resultMysql = await connMysql.query(mysqlString);
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
            const mysqlString = `delete from employee where \`Employee Number\`=${employee_code}`;
            const resultMysql = await connMysql.query(mysqlString);
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
