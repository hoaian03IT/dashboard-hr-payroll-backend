const { connectMySQL, connectSQL } = require("../../db");

class Summary {
    async getTotalEarnings(req, res) {
        try {
            const conn = await connectMySQL();
            let [results, fields] = await conn.query(
                "select sum(`Paid To Date`) as `Sum Paid To Date`, sum(`Paid Last Year`) as `Sum Paid To Year`from employee"
            );

            conn.end();

            res.status(200).json({
                paidToDate: Number(results[0][0]),
                paidToLastYear: Number(results[0][1]),
            });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getEarningByDepartment(req, res) {
        try {
            const conn = await connectSQL();
            // const [rows] = await conn.request.query();
            conn.close();
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getBenefitPaid(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            // query strings
            const queryIdShareholderStr = (isShareholder = 0) =>
                `select EMPLOYMENT_CODE from PERSONAL P, EMPLOYMENT E where P.PERSONAL_ID=E.PERSONAL_ID AND SHAREHOLDER_STATUS=${isShareholder}`;
            const queryAvgAmountStr = (records = []) =>
                `select round(sum(\`Paid To Date\`),1) as \`Sum Amount\`,  round(avg(\`Paid To Date\`), 1) as \`Average Amount\` from employee e where e.\`Employee Number\` in (${records.map(
                    (record) => `'${record.EMPLOYMENT_CODE}'`
                )})`;

            // query benefit paid for shareholder
            const { recordset: shareholderIds } = await connSQL.request().query(queryIdShareholderStr(1));
            const [[amountOfShareholders]] = await connMySQL.query(queryAvgAmountStr(shareholderIds));

            // query benefit paid for non-shareholder
            const { recordset: nonShareholderIds } = await connSQL.request().query(queryIdShareholderStr(0));
            const [[amountOfNonShareholders]] = await connMySQL.query(queryAvgAmountStr(nonShareholderIds));

            connSQL.close();
            connMySQL.end();

            res.status(200).json({
                average: {
                    shareholder: amountOfShareholders["Average Amount"],
                    nonShareholder: amountOfNonShareholders["Average Amount"],
                },
                total: {
                    shareholder: amountOfShareholders["Sum Amount"],
                    nonShareholder: amountOfNonShareholders["Sum Amount"],
                },
            });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getBenefitPlanSummary(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            const { name: benefitPlanName } = req.query;

            const queryString = `select BENEFIT_PLAN_ID, PLAN_NAME, DEDUCTABLE, PERCENTAGE_COPAY, PERSONAL.PERSONAL_ID, EMPLOYMENT_CODE from BENEFIT_PLANS
                                inner join PERSONAL on BENEFIT_PLANS.BENEFIT_PLANS_ID=PERSONAL.BENEFIT_PLAN_ID
                                inner join EMPLOYMENT on EMPLOYMENT.PERSONAL_ID=PERSONAL.PERSONAL_ID
                                ${benefitPlanName ? `where PLAN_NAME like '%${benefitPlanName}%'` : ""}
                                order by BENEFIT_PLAN_ID`;
            const { recordset } = await connSQL.request().query(queryString);

            if (recordset.length === 0) {
                return res
                    .status(403)
                    .json({ title: "Error", message: `The plan name ${benefitPlanName} is not existed` });
            }

            let results = [];
            let tmp = [];

            // convert to each of benefit plans has set of employee_code
            recordset.forEach((record) => {
                if (!tmp.includes(record.BENEFIT_PLAN_ID)) {
                    tmp.push(record.BENEFIT_PLAN_ID);
                    results.push({
                        BENEFIT_PLAN_ID: record.BENEFIT_PLAN_ID,
                        PLAN_NAME: record.PLAN_NAME,
                        DEDUCTABLE: record.DEDUCTABLE,
                        PERCENTAGE_COPAY: record.PERCENTAGE_COPAY,
                        employmentCodes: [record.EMPLOYMENT_CODE],
                    });
                } else {
                    results[results.length - 1]?.employmentCodes.push(record.EMPLOYMENT_CODE);
                }
            });

            connSQL.close();

            tmp = [];
            for (let i = 0; i < results.length; i++) {
                let queryString = `select round(sum(\`Pay Amount\`),1) as \`Sum Amount\`,  round(avg(\`Pay Amount\`), 1) as \`Average Amount\` from \`pay rates\` p, employee e 
                                where p.\`idPay Rates\`=e.\`Pay Rates_idPay Rates\` and e.\`Employee Number\` in (${results[
                                    i
                                ]?.employmentCodes?.map((code) => `'${code}'`)})`;
                const [[amount]] = await connMySQL.query(queryString);
                const { BENEFIT_PLAN_ID, PLAN_NAME, DEDUCTABLE, PERCENTAGE_COPAY } = results[i];
                results[i] = {
                    BENEFIT_PLAN_ID,
                    PLAN_NAME,
                    DEDUCTABLE,
                    PERCENTAGE_COPAY,
                    AVERAGE: amount["Average Amount"],
                    TOTAL: amount["Sum Amount"],
                };
            }

            connMySQL.end();

            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getSummaryVacationDays(req, res) {
        try {
            const connSQL = await connectSQL();

            let queryString = `select sum(TOTAL_NUMBER_VACATION_WORKING_DAYS_PER_MONTH) as TOTAL_VACATION_DAYS from EMPLOYMENT_WORKING_TIME`;
            const { recordset: vacationDayToDate } = await connSQL.request().query(queryString);

            queryString = `select sum(TOTAL_NUMBER_VACATION_WORKING_DAYS_PER_MONTH) as TOTAL_VACATION_DAYS  from EMPLOYMENT_WORKING_TIME
                        where YEAR(YEAR_WORKING)<YEAR(GETDATE())`;

            const { recordset: vacationDayToPreviousYear } = await connSQL.request().query(queryString);

            connSQL.close();
            res.status(200).json({
                toDate: vacationDayToDate[0].TOTAL_VACATION_DAYS,
                toPreviousYear: vacationDayToPreviousYear[0].TOTAL_VACATION_DAYS,
            });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getEmployeeVacationDay(req, res) {
        try {
            const { employeeCode = "", gender = "" } = req.query;

            const connSQL = await connectSQL();

            let queryString = `select CURRENT_FIRST_NAME, CURRENT_LAST_NAME, T.EMPLOYMENT_CODE, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY, EMPLOYMENT_STATUS, TOTAL_VD from PERSONAL P, (
                            select EMPLOYMENT_CODE, sum(TOTAL_NUMBER_VACATION_WORKING_DAYS_PER_MONTH) as TOTAL_VD 
                            from EMPLOYMENT_WORKING_TIME ET, EMPLOYMENT E
                            where E.EMPLOYMENT_ID=ET.EMPLOYMENT_ID
                            group by EMPLOYMENT_CODE
                            ) T, EMPLOYMENT E
                            where T.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE and E.PERSONAL_ID=P.PERSONAL_ID ${
                                employeeCode ? `and T.EMPLOYMENT_CODE='${employeeCode}'` : ""
                            } ${gender ? `and CURRENT_GENDER='${gender}'` : ""}`;
            const { recordset } = await connSQL.request().query(queryString);
            connSQL.close();

            res.status(200).json(recordset);
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getSummaryEarnings(req, res) {
        try {
            const connMySQL = await connectMySQL();
            let queryString =
                "select sum(`Paid To Date`) as `Total To Date`, sum(`Paid Last Year`) as `Total To Previous Year` from employee;";

            const [[result]] = await connMySQL.query(queryString);
            connMySQL.end();

            res.status(200).json({
                totalToDate: result["Total To Date"],
                totalToPreviousYear: result["Total To Previous Year"],
            });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getEarningByDepartment(req, res) {
        try {
            const connMySQL = await connectMySQL();
        } catch (error) {}
    }
}

module.exports = new Summary();
