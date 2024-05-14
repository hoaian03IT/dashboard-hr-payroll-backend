const { connectSQL, connectMySQL } = require("../../db");

const ensureMySQLViewExists = async (connectMySQL, view, createViewStr) => {
    try {
        await connectMySQL.query(`select top 1 * from ${view}`);
    } catch (error) {
        try {
            await connectMySQL.query(createViewStr);
        } catch (error) {
            console.error(error.message);
        }
    }
};

const ensureSQLViewExists = async (connectSQL, view, createViewStr) => {
    try {
        await connectSQL.request().query(`select top 1 * from ${view}`);
    } catch (error) {
        try {
            await connectSQL.request().query(createViewStr);
        } catch (error) {
            console.error(error.message);
        }
    }
};

const processHandleRecordsEarnings = async (connectMySQL, recordset) => {
    // init result
    const result = {
        shareholderStatus: {
            shareholder: 0,
            nonShareholder: 0,
        },
        genderStatus: {
            male: 0,
            female: 0,
        },
        employmentStatus: {
            fullTime: 0,
            partTime: 0,
        },
        ethnicityStatus: {},
    };

    for (let record of recordset) {
        const [payRateInfos] = await connectMySQL.query(
            `select  \`Employee Number\`, \`Pay Type\`, \`Value\`, \`Tax Percentage\` from \`employee pay rates\`where \`Employee Number\`='${record.EMPLOYMENT_CODE}' limit 1`
        );
        let amount;
        // pay rate
        // 1: part time
        // 0: full time
        if (payRateInfos[0]["Pay Type"] === 1) {
            const hoursPerDay = 4;
            amount = record["TOTAL_WORKING_DAYS"] * payRateInfos[0]["Value"] * hoursPerDay;
            result.employmentStatus.partTime += amount;
        } else if (payRateInfos[0]["Pay Type"] === 0) {
            amount = record["TOTAL_WORKING_DAYS"] * payRateInfos[0]["Value"];
            result.employmentStatus.fullTime += amount;
        }

        // shareholder_status
        // 0: non-shareholder
        // 1: shareholder
        if (record.SHAREHOLDER_STATUS === 0) result.shareholderStatus.nonShareholder += amount;
        else result.shareholderStatus.shareholder += amount;

        // gender_status
        // 0: male
        // 1: female
        if (record.CURRENT_GENDER === 0) result.genderStatus.male += amount;
        else result.genderStatus.female += amount;

        if (result.ethnicityStatus[record.ETHNICITY] === undefined) {
            result.ethnicityStatus[record.ETHNICITY] = amount;
        } else {
            result.ethnicityStatus[record.ETHNICITY] += amount;
        }
    }

    return result;
};

class Details {
    async getDetailEarningsToDate(req, res) {
        try {
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();

            let createViewStr = `create view EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE as
            select EMPLOYMENT_CODE , sum(NUMBER_DAYS_ACTUAL_OF_WORKING_PER_MONTH) as TOTAL_WORKING_DAYS
            from EMPLOYMENT E, EMPLOYMENT_WORKING_TIME EWT
            where E.EMPLOYMENT_ID=EWT.EMPLOYMENT_ID and YEAR_WORKING >= HIRE_DATE_FOR_WORKING and (TERMINATION_DATE is NULL or YEAR_WORKING <= TERMINATION_DATE)
            group by EMPLOYMENT_CODE`;

            // check and create view EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE
            await ensureSQLViewExists(connSQL, "EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE", createViewStr);

            let queryStr = `select E.EMPLOYMENT_CODE, TOTAL_WORKING_DAYS, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY, EMPLOYMENT_STATUS from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE EWTE, EMPLOYMENT E, PERSONAL P
            where E.PERSONAL_ID=P.PERSONAL_ID and EWTE.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE`;
            let { recordset } = await connSQL.request().query(queryStr);

            createViewStr = `create view \`employee pay rates\` as 
            select \`Employee Number\`, p.\`idPay Rates\`, \`Value\`, \`Tax Percentage\`, \`Pay Type\` from employee e, \`pay rates\` p
            where e.\`Pay Rates_idPay Rates\`=p.\`idPay Rates\`
            `;

            // check and create view EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE
            await ensureMySQLViewExists(connectMySQL, "`employee pay rates`", createViewStr);

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

            let createViewStr = `create view EMPLOYMENT_TOTAL_WORKING_DAYS_TO_PREVIOUS_YEAR as
            select EMPLOYMENT_CODE , sum(NUMBER_DAYS_ACTUAL_OF_WORKING_PER_MONTH) as TOTAL_WORKING_DAYS
            from EMPLOYMENT E, EMPLOYMENT_WORKING_TIME EWT
            where E.EMPLOYMENT_ID=EWT.EMPLOYMENT_ID and YEAR_WORKING >= HIRE_DATE_FOR_WORKING and year(YEAR_WORKING) < year(getdate()) and (TERMINATION_DATE is NULL or YEAR_WORKING <= TERMINATION_DATE)
            group by EMPLOYMENT_CODE`;

            // check and create view EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE
            await ensureSQLViewExists(connSQL, "EMPLOYMENT_TOTAL_WORKING_DAYS_TO_PREVIOUS_YEAR", createViewStr);

            let queryStr = `select E.EMPLOYMENT_CODE, TOTAL_WORKING_DAYS, SHAREHOLDER_STATUS, CURRENT_GENDER, ETHNICITY, EMPLOYMENT_STATUS from EMPLOYMENT_TOTAL_WORKING_DAYS_TO_PREVIOUS_YEAR EWTE, EMPLOYMENT E, PERSONAL P
            where E.PERSONAL_ID=P.PERSONAL_ID and EWTE.EMPLOYMENT_CODE=E.EMPLOYMENT_CODE`;
            let { recordset } = await connSQL.request().query(queryStr);

            createViewStr = `create view \`employee pay rates\` as 
            select \`Employee Number\`, p.\`idPay Rates\`, \`Value\`, \`Tax Percentage\`, \`Pay Type\` from employee e, \`pay rates\` p
            where e.\`Pay Rates_idPay Rates\`=p.\`idPay Rates\`
            `;

            // check and create view EMPLOYMENT_TOTAL_WORKING_DAYS_TO_DATE
            await ensureMySQLViewExists(connectMySQL, "`employee pay rates`", createViewStr);

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
}

module.exports = new Details();
