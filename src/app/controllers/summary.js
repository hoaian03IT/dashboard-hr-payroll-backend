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

    async getEarningByShareholder(req, res) {
        try {
            const conn = await connectSQL();
            const [rows] = await conn.request.query();
        } catch (error) {}
    }

    async getBenefitPaid(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            // query strings
            const queryIdShareholderStr = (isShareholder = 0) =>
                `select EMPLOYMENT_CODE from PERSONAL P, EMPLOYMENT E where P.PERSONAL_ID=E.PERSONAL_ID AND SHAREHOLDER_STATUS=${isShareholder}`;
            const queryAvgAmountStr = (records = []) =>
                `select round(sum(\`Pay Amount\`),1) as \`Sum Amount\`,  round(avg(\`Pay Amount\`), 1) as \`Average Amount\` from \`pay rates\` p, employee e where p.\`idPay Rates\`=e.\`Pay Rates_idPay Rates\` and e.\`Employee Number\` in (${records.map(
                    (record) => Number(record.EMPLOYMENT_CODE)
                )})`;

            // query benefit paid for shareholder
            const { recordset: shareholderIds } = await connSQL.request().query(queryIdShareholderStr(1));
            const [[amountOfShareholders]] = await connMySQL.query(queryAvgAmountStr(shareholderIds));

            // query benefit paid for non-shareholder
            const { recordset: nonShareholderIds } = await connSQL.request().query(queryIdShareholderStr(0));
            const [[amountOfNonShareholders]] = await connMySQL.query(queryAvgAmountStr(nonShareholderIds));

            connSQL.close();
            connMySQL.release();

            res.status(200).json({
                average: {
                    shareholder: amountOfShareholders["Average Amount"],
                    nonShareHolder: amountOfNonShareholders["Average Amount"],
                },
                total: {
                    shareholder: amountOfShareholders["Sum Amount"],
                    nonShareHolder: amountOfNonShareholders["Sum Amount"],
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
                                where p.\`idPay Rates\`=e.\`Pay Rates_idPay Rates\` and e.\`Employee Number\` in (${results[i].employmentCodes})`;
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

            connMySQL.release();

            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }
}

module.exports = new Summary();
