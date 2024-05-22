const { connectMySQL, connectSQL } = require("../../db");
const {
    HOUR_WORKING_PER_DAY,
    FULL_TIME_TYPE,
    PART_TIME_TYPE,
    SHAREHOLDER_STATUS,
    NON_SHAREHOLDER_STATUS,
} = require("../../constance");

const summarizeEarnings = async (recordset, connMySQL) => {
    let total = 0;
    for (let record of recordset) {
        const [[payRateInfos]] = await connMySQL.query(
            `select  \`Employee Number\`, \`Pay Type\`, \`Value\`, \`Tax Percentage\`, \`Pay Amount\` from \`employee pay rates\`where \`Employee Number\`='${record["EMPLOYMENT_CODE"]}' limit 1`
        );
        let amount;
        // pay rate
        // 1: part time
        // 0: full time
        if (payRateInfos["Pay Type"] === PART_TIME_TYPE) {
            amount = payRateInfos["Pay Amount"] * HOUR_WORKING_PER_DAY * record["TOTAL_WORKING_DAYS"];
        } else if (payRateInfos["Pay Type"] === FULL_TIME_TYPE) {
            amount = payRateInfos["Pay Amount"] * record["TOTAL_WORKING_MONTH"];
        }
        total += amount;
    }
    return total;
};

const summarizedVacationDays = async (recordset, connMySQL) => {
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
        const [[paymentInfo]] = await connMySQL.query(
            `select \`Pay Type\` from \`employee pay rates\` where \`Employee Number\`='${record["EMPLOYMENT_CODE"]}'`
        );

        console.log(record);
        if (paymentInfo["Pay Type"] === PART_TIME_TYPE) {
            result["type-employment"]["part-time"] += record["TOTAL_VACATION_DAYS"];
        } else if (paymentInfo["Pay Type"] === FULL_TIME_TYPE) {
            result["type-employment"]["full-time"] += record["TOTAL_VACATION_DAYS"];
        }

        if (record.SHAREHOLDER_STATUS === NON_SHAREHOLDER_STATUS)
            result["shareholder-status"]["non-shareholder"] += record["TOTAL_VACATION_DAYS"];
        else result["shareholder-status"].shareholder += record["TOTAL_VACATION_DAYS"];

        // gender_status
        const maleGender = ["male", "Male", "Men", "men"];
        const femaleGender = ["female", "Female", "Women", "women"];
        if (maleGender.includes(record.CURRENT_GENDER)) result["gender"].male += record["TOTAL_VACATION_DAYS"];
        else if (femaleGender.includes(record.CURRENT_GENDER)) result["gender"].female += record["TOTAL_VACATION_DAYS"];

        if (result.ethnicity[record.ETHNICITY] === undefined) {
            result.ethnicity[record.ETHNICITY] = record["TOTAL_VACATION_DAYS"];
        } else {
            result.ethnicity[record.ETHNICITY] += record["TOTAL_VACATION_DAYS"];
        }
    }
    return result;
};

class Summary {
    async getTotalEarnings(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            let { recordset: recordsetToPreviousYear } = await connSQL.request()
                .query(`select E.EMPLOYMENT_CODE, TOTAL_WORKING_DAYS, TOTAL_WORKING_MONTH, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY, EMPLOYMENT_STATUS 
            from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_PREVIOUS_YEAR EWTE, EMPLOYMENT E, PERSONAL P
            where E.PERSONAL_ID=P.PERSONAL_ID and EWTE.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE
            order by ETHNICITY
            `);

            let { recordset: recordsetToDate } = await connSQL.request()
                .query(`select E.EMPLOYMENT_CODE, TOTAL_WORKING_DAYS, TOTAL_WORKING_MONTH, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY, EMPLOYMENT_STATUS 
            from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE EWTE, EMPLOYMENT E, PERSONAL P
            where E.PERSONAL_ID=P.PERSONAL_ID and EWTE.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE
            order by ETHNICITY
            `);

            // handle recordset
            const totalToPreviousYear = await summarizeEarnings(recordsetToPreviousYear, connMySQL);
            const totalToDate = await summarizeEarnings(recordsetToDate, connMySQL);

            connMySQL.end();
            connSQL.close();

            res.status(200).json({ totalToPreviousYear, totalToDate });
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

    async getTotalPersonnel(req, res) {
        try {
            const connSQL = await connectSQL();
            const { recordset: recordsetPersonal } = await connSQL
                .request()
                .query("select count(*) as TOTAL_PERSONAL from PERSONAL");
            const { recordset: recordsetEmployment } = await connSQL
                .request()
                .query(
                    "select EMPLOYMENT_STATUS, count(*) as TOTAL_EMPLOYMENT from EMPLOYMENT group by EMPLOYMENT_STATUS"
                );
            connSQL.close();
            res.status(200).json({ employment: recordsetEmployment, personnel: recordsetPersonal[0] });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getEarningByCategory(req, res) {
        try {
            let { end, by } = req.query;

            let endMonth =
                end === "prev-year"
                    ? `12/${new Date().getFullYear() - 1}`
                    : `${new Date().getMonth()}/${new Date().getFullYear()}`;

            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            const { recordset } = await connSQL.request()
                .query(`select E.EMPLOYMENT_CODE, YEAR_WORKING, MONTH_WORKING, NUMBER_DAYS_ACTUAL_OF_WORKING_PER_MONTH, TOTAL_NUMBER_VACATION_WORKING_DAYS_PER_MONTH, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY
                from EMPLOYMENT E, EMPLOYMENT_WORKING_TIME EWT, PERSONAL P
                where E.EMPLOYMENT_ID=EWT.EMPLOYMENT_ID and E.PERSONAL_ID=P.PERSONAL_ID 
                and year(YEAR_WORKING)<=${endMonth.split("/")[1]}
                and MONTH_WORKING<=${endMonth.split("/")[0]}
                order by year(YEAR_WORKING), MONTH_WORKING
            `);

            if (recordset.length > 0) {
                let response = new Map();

                let month = recordset[0]["MONTH_WORKING"], // if startMonth is existed, month and year was taken from it, else them was taken from the first record was order by year and month asc
                    year = new Date(recordset[0]["YEAR_WORKING"]).getFullYear();

                // generate init value of map
                let initValue = {};
                if (by === "shareholder-status") {
                    initValue = { shareholder: 0, "non-shareholder": 0 };
                } else if (by === "gender") {
                    initValue = { male: 0, female: 0, other: 0 };
                } else if (by === "type-employment") {
                    initValue = { "full-time": 0, "part-time": 0 };
                } else if (by === "ethnicity") {
                    const { recordset: ethnicityset } = await connSQL
                        .request()
                        .query(`select ETHNICITY from PERSONAL group by ETHNICITY`);

                    for (let ethnicity of ethnicityset) {
                        initValue = { ...initValue, [ethnicity["ETHNICITY"].trim()]: 0 };
                    }
                } else {
                    return res.status(403).json({
                        title: "Error",
                        message: `Invalid query 'by=${by}'`,
                    });
                }

                // init month/year from start to end
                response.set("", initValue);
                while (true) {
                    response.set(`${month}/${year}`, initValue);

                    if (year >= endMonth.split("/")[1] && month >= endMonth.split("/")[0]) break;

                    if (month === 12) {
                        month = 1;
                        year++;
                    } else {
                        month++;
                    }
                }

                for (let record of recordset) {
                    const [[employeePayment]] = await connMySQL.query(
                        `select * from \`employee pay rates\` where \`Employee Number\`='${record["EMPLOYMENT_CODE"]}'`
                    );

                    let amount;

                    if (employeePayment["Pay Type"] === PART_TIME_TYPE) {
                        amount =
                            Number(employeePayment["Pay Amount"]) *
                            Number(HOUR_WORKING_PER_DAY) *
                            record["NUMBER_DAYS_ACTUAL_OF_WORKING_PER_MONTH"];
                    } else {
                        amount = Number(employeePayment["Pay Amount"]);
                    }

                    let time = `${record["MONTH_WORKING"]}/${new Date(record["YEAR_WORKING"]).getFullYear()}`;

                    switch (by) {
                        case "shareholder-status":
                            record["SHAREHOLDER_STATUS"] === SHAREHOLDER_STATUS
                                ? response.set(time, {
                                      ...response.get(time),
                                      shareholder: response.get(time).shareholder + amount,
                                  })
                                : response.set(time, {
                                      ...response.get(time),
                                      "non-shareholder": response.get(time)["non-shareholder"] + amount,
                                  });
                            break;
                        case "gender":
                            ["male", "men"].includes(record["CURRENT_GENDER"].toLowerCase())
                                ? response.set(time, {
                                      ...response.get(time),
                                      male: response.get(time).male + amount,
                                  })
                                : ["female", "women"].includes(record["CURRENT_GENDER"].toLowerCase())
                                ? response.set(time, {
                                      ...response.get(time),
                                      female: response.get(time).female + amount,
                                  })
                                : response.set(time, {
                                      ...response.get(time),
                                      other: response.get(time).other + amount,
                                  });
                            break;

                        case "type-employment":
                            employeePayment["Pay Type"] === PART_TIME_TYPE
                                ? response.set(time, {
                                      ...response.get(time),
                                      "part-time": response.get(time)["part-time"] + amount,
                                  })
                                : response.set(time, {
                                      ...response.get(time),
                                      "full-time": response.get(time)["full-time"] + amount,
                                  });
                            break;
                        case "ethnicity":
                            response.set(time, {
                                ...response.get(time),
                                [record["ETHNICITY"].trim()]: response.get(time)[record["ETHNICITY"].trim()] + amount,
                            });
                            break;
                        default:
                            return res.status(403).json({
                                title: "Error",
                                message: `Invalid query 'by=${by}'`,
                            });
                    }
                }

                // convert to array
                response = Array.from(response);
                connMySQL.end();
                connSQL.close();

                res.status(200).json({ earnings: response });
            } else {
                res.status(200).json({ earnings: [] });
            }
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }

    async getVacationDayByCategories(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            const { recordset: recordsetToDate } = await connSQL.request().query(`
            select ETV.EMPLOYMENT_CODE, TOTAL_VACATION_DAYS, CURRENT_GENDER, ETHNICITY, SHAREHOLDER_STATUS from EMPLOYMENT_TOTAL_VACATION_DAYS_TO_DATE ETV, EMPLOYMENT E, PERSONAL P
            where ETV.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE and E.PERSONAL_ID=P.PERSONAL_ID`);

            const { recordset: recordsetToPreviousYear } = await connSQL.request().query(`
            select ETV.EMPLOYMENT_CODE, TOTAL_VACATION_DAYS, CURRENT_GENDER, ETHNICITY, SHAREHOLDER_STATUS from EMPLOYMENT_TOTAL_VACATION_DAYS_TO_PREVIOUS_YEAR ETV, EMPLOYMENT E, PERSONAL P
            where ETV.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE and E.PERSONAL_ID=P.PERSONAL_ID`);

            const vacationDayToDate = await summarizedVacationDays(recordsetToDate, connMySQL);
            const vacationDayToPreviousYear = await summarizedVacationDays(recordsetToPreviousYear, connMySQL);

            connSQL.close();
            connMySQL.end();
            res.status(200).json({ vacationDayToDate, vacationDayToPreviousYear });
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }
}

module.exports = new Summary();
