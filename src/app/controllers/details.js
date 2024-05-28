const { connectSQL, connectMySQL } = require("../../db");
const { ensureSQLViewExists, ensureMySQLViewExists } = require("../../utils/checkViewExist");
const {
    HOUR_WORKING_PER_DAY,
    FULL_TIME_TYPE,
    PART_TIME_TYPE,
    SHAREHOLDER_STATUS,
    NON_SHAREHOLDER_STATUS,
} = require("../../constance");

const processHandleRecordsEarnings = async (connectMySQL, recordset) => {
    // init result
    const result = {
        "shareholder-status": {
            shareholder: 0,
            "non-shareholder": 0,
        },
        gender: {
            male: 0,
            female: 0,
        },
        "type-employment": {
            "full-time": 0,
            "part-time": 0,
        },
        ethnicity: {},
    };

    for (let record of recordset) {
        const [[payRateInfos]] = await connectMySQL.query(
            `select  \`Employee Number\`, \`Pay Type\`, \`Value\`, \`Tax Percentage\`, \`Pay Amount\` from \`employee pay rates\`where \`Employee Number\`='${record["EMPLOYMENT_CODE"]}' limit 1`
        );
        let amount;
        // pay rate
        // 1: part time
        // 0: full time
        if (payRateInfos["Pay Type"] === PART_TIME_TYPE) {
            amount = payRateInfos["Pay Amount"] * HOUR_WORKING_PER_DAY * record["TOTAL_WORKING_DAYS"];
            result["type-employment"]["part-time"] += amount;
        } else if (payRateInfos["Pay Type"] === FULL_TIME_TYPE) {
            amount = payRateInfos["Pay Amount"] * record["TOTAL_WORKING_MONTH"];
            result["type-employment"]["full-time"] += amount;
        }

        // shareholder_status
        // 0: non-shareholder
        // 1: shareholder
        if (record.SHAREHOLDER_STATUS === NON_SHAREHOLDER_STATUS)
            result["shareholder-status"]["non-shareholder"] += amount;
        else result["shareholder-status"].shareholder += amount;

        // gender_status
        const maleGender = ["male", "Male", "Men", "men"];
        const femaleGender = ["female", "Female", "Women", "women"];
        if (maleGender.includes(record.CURRENT_GENDER)) result["gender"].male += amount;
        else if (femaleGender.includes(record.CURRENT_GENDER)) result["gender"].female += amount;

        if (result.ethnicity[record.ETHNICITY] === undefined) {
            result.ethnicity[record.ETHNICITY] = amount;
        } else {
            result.ethnicity[record.ETHNICITY] += amount;
        }
    }

    return result;
};

class Details {
    async getDetailEarningsToDate(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            let queryStr = `select E.EMPLOYMENT_CODE, TOTAL_WORKING_DAYS, TOTAL_WORKING_MONTH, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY, EMPLOYMENT_STATUS from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE EWTE, EMPLOYMENT E, PERSONAL P
            where E.PERSONAL_ID=P.PERSONAL_ID and EWTE.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE order by ETHNICITY`;

            let { recordset } = await connSQL.request().query(queryStr);

            // handle recordset
            const result = await processHandleRecordsEarnings(connMySQL, recordset);

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }
    async getDetailEarningsToPreviousYear(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            let queryStr = `select E.EMPLOYMENT_CODE, TOTAL_WORKING_DAYS, TOTAL_WORKING_MONTH, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY, EMPLOYMENT_STATUS from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_PREVIOUS_YEAR EWTE, EMPLOYMENT E, PERSONAL P
            where E.PERSONAL_ID=P.PERSONAL_ID and EWTE.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE order by ETHNICITY`;

            let { recordset } = await connSQL.request().query(queryStr);

            // handle recordset
            const result = await processHandleRecordsEarnings(connMySQL, recordset);

            connMySQL.end();
            connSQL.close();

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async fetchDetailEarningByList(req, res) {
        try {
            let { employeeCode, shareholder, gender, typePayment } = req.query;

            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            if (["0", "1"].includes(typePayment) && !employeeCode) {
                const [resultQuery] = await connMySQL.query(
                    `select \`Employee Number\` from \`employee pay rates\` where \`Pay Type\`=${typePayment}`
                );

                employeeCode = resultQuery.map((item) => item && item["Employee Number"]);
            }

            let queryStr = `select CURRENT_FIRST_NAME, CURRENT_LAST_NAME, SHAREHOLDER_STATUS,  CURRENT_GENDER, ETHNICITY, E.EMPLOYMENT_CODE, EMPLOYMENT_STATUS
            from EMPLOYMENT E, PERSONAL P
            where E.PERSONAL_ID=P.PERSONAL_ID
            ${
                Array.isArray(employeeCode)
                    ? `and E.EMPLOYMENT_CODE in (${employeeCode?.map((code) => `'${code}'`)})`
                    : employeeCode
                    ? `and E.EMPLOYMENT_CODE='${employeeCode}'`
                    : ""
            }
            ${["0", "1"].includes(shareholder) ? `and SHAREHOLDER_STATUS=${shareholder}` : ""}
            ${["male", "female"].includes(gender) ? `and lower(CURRENT_GENDER)='${gender}'` : ""}
            `;

            const { recordset } = await connSQL.request().query(queryStr);

            const response = [];

            for (let record of recordset) {
                const { recordset: recordsetToPreviousYear } = await connSQL
                    .request()
                    .query(
                        `select * from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_PREVIOUS_YEAR where EMPLOYMENT_CODE='${record["EMPLOYMENT_CODE"]}'`
                    );

                const { recordset: recordsetToDate } = await connSQL
                    .request()
                    .query(
                        `select * from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE where EMPLOYMENT_CODE='${record["EMPLOYMENT_CODE"]}'`
                    );

                const [[payRateInfo]] = await connMySQL.query(
                    `select * from \`employee pay rates\` where \`Employee Number\`='${record["EMPLOYMENT_CODE"]}'`
                );

                let AMOUNT_TO_DATE, AMOUNT_TO_PREVIOUS_YEAR;
                let PAYMENT;

                if (payRateInfo["Pay Type"] === PART_TIME_TYPE) {
                    AMOUNT_TO_DATE = recordsetToDate[0]
                        ? Number(payRateInfo["Pay Amount"]) *
                          Number(HOUR_WORKING_PER_DAY) *
                          Number(recordsetToDate[0]["TOTAL_WORKING_DAYS"])
                        : 0;

                    AMOUNT_TO_PREVIOUS_YEAR = recordsetToPreviousYear[0]
                        ? Number(payRateInfo["Pay Amount"]) *
                          Number(HOUR_WORKING_PER_DAY) *
                          Number(recordsetToPreviousYear[0]["TOTAL_WORKING_DAYS"])
                        : 0;

                    PAYMENT = "Part time";
                } else if (payRateInfo["Pay Type"] === FULL_TIME_TYPE) {
                    AMOUNT_TO_DATE = recordsetToDate[0]
                        ? Number(payRateInfo["Pay Amount"]) * Number(recordsetToDate[0]["TOTAL_WORKING_MONTH"])
                        : 0;
                    AMOUNT_TO_PREVIOUS_YEAR = recordsetToPreviousYear[0]
                        ? Number(payRateInfo["Pay Amount"]) * Number(recordsetToPreviousYear[0]["TOTAL_WORKING_MONTH"])
                        : 0;
                    PAYMENT = "Full time";
                }
                response.push({ ...record, PAYMENT, AMOUNT_TO_DATE, AMOUNT_TO_PREVIOUS_YEAR });
            }

            connSQL.close();
            connMySQL.end();

            res.status(200).json({ list: response });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getDetailBenefitPaid(req, res) {
        try {
            const { "shareholder-status": shareholderStatus } = req.query;

            const shareholderStatusQuery = shareholderStatus == 0 ? 0 : shareholderStatus == 1 ? 1 : "all";

            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            const { recordset } = await connSQL.request().query(
                `select PERSONAL_ID, CURRENT_FIRST_NAME, CURRENT_LAST_NAME, CURRENT_MIDDLE_NAME, ETHNICITY, CURRENT_GENDER ,SHAREHOLDER_STATUS  from PERSONAL 
                    ${shareholderStatusQuery !== "all" ? `where SHAREHOLDER_STATUS=${shareholderStatusQuery}` : ""}
                    `
            );

            let response = [];

            for (let record of recordset) {
                const { recordset } = await connSQL
                    .request()
                    .query(`select EMPLOYMENT_CODE from EMPLOYMENT where PERSONAL_ID='${record["PERSONAL_ID"]}'`);

                const employeeCodeSet =
                    recordset.length > 1
                        ? `in (${recordset.map((record) => `'${record["EMPLOYMENT_CODE"]}'`)})`
                        : `='${recordset[0]?.["EMPLOYMENT_CODE"]}'`;

                const [[resultQuery]] =
                    await connMySQL.query(`select AVG(\`Paid To Date\`) as \`Avg Paid To Date\`, AVG(\`Paid Last Year\`) as \`Avg Paid Last Year\` 
                    from employee e, \`pay rates\` p
                    where e.\`Pay Rates_idPay Rates\`=p.\`idPay Rates\` 
                    and \`Employee Number\` ${employeeCodeSet}
                    `);

                response.push({ ...record, ...resultQuery });
            }

            connSQL.close();
            connMySQL.end();

            res.status(200).json({ list: response });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getDetailVacationDay(req, res) {
        try {
            let {
                "employee-code": employeeCode = "",
                gender = "",
                "shareholder-status": shareholderStatus = "",
                "type-payment": typePayment = "",
            } = req.query;

            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            console.log({ employeeCode, gender, shareholderStatus, typePayment });

            if (typePayment !== "" && !employeeCode) {
                const [resultQuery] = await connMySQL.query(
                    `select \`Employee Number\` from \`employee pay rates\` where \`Pay Type\`=${typePayment}`
                );

                employeeCode = resultQuery.map((item) => item && item["Employee Number"]);
            }

            let queryString = `select CURRENT_FIRST_NAME,CURRENT_LAST_NAME,E.EMPLOYMENT_CODE,SHAREHOLDER_STATUS,ETHNICITY,CURRENT_GENDER,EMPLOYMENT_STATUS from PERSONAL P, EMPLOYMENT E
            where P.PERSONAL_ID = E.PERSONAL_ID
            ${
                Array.isArray(employeeCode)
                    ? `and E.EMPLOYMENT_CODE in (${employeeCode?.map((code) => `'${code}'`)})`
                    : employeeCode
                    ? `and E.EMPLOYMENT_CODE='${employeeCode}'`
                    : ""
            }
            ${["0", "1"].includes(shareholderStatus) ? `and SHAREHOLDER_STATUS=${shareholderStatus}` : ""}
            ${["male", "female"].includes(gender) ? `and lower(CURRENT_GENDER)='${gender}'` : ""}
            `;
            const { recordset } = await connSQL.request().query(queryString);

            const response = [];
            for (let record of recordset) {
                const { recordset: lastYear } = await connSQL
                    .request()
                    .query(
                        `select sum(TOTAL_VACATION_DAYS) as TOTAL_VACATION_DAYS from EMPLOYMENT_TOTAL_VACATION_DAYS_TO_PREVIOUS_YEAR where EMPLOYMENT_CODE='${record["EMPLOYMENT_CODE"]}'`
                    );
                const [[toDate]] = await connMySQL.query(
                    `select sum(\`Vacation Days\`) as \`Vacation Days\`, \`Pay Type\` from  employee e, \`pay rates\` p where e.\`Pay Rates_idPay Rates\`=p.\`idPay Rates\` and \`Employee Number\`='${record["EMPLOYMENT_CODE"]}'`
                );

                response.push({
                    ...record,
                    VACATION_DAY_LAST_YEAR: lastYear[0]["TOTAL_VACATION_DAYS"]
                        ? Number(lastYear[0]["TOTAL_VACATION_DAYS"])
                        : 0,
                    VACATION_DAY_TO_DATE: toDate["Vacation Days"] ? Number(toDate["Vacation Days"]) : 0,
                    TYPE_PAYMENT: toDate["Pay Type"] === 0 ? "Full time" : "Part time",
                });
            }

            connMySQL.end();
            connSQL.close();

            res.status(200).json({ list: response });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }
}

module.exports = new Details();
