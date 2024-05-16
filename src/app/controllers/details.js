const { connectSQL, connectMySQL } = require("../../db");
const { ensureSQLViewExists, ensureMySQLViewExists } = require("../../utils/checkViewExist");

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
            result["type-employment"]["part-time"] += amount;
        } else if (payRateInfos[0]["Pay Type"] === 0) {
            const actualPayValue =
                payRateInfos[0]["Value"] - (payRateInfos[0]["Value"] * payRateInfos[0][`Tax Percentage`]) / 100;
            amount = Number(record["TOTAL_WORKING_MONTH"]) * actualPayValue;
            result["type-employment"]["full-time"] += amount;
        }

        // shareholder_status
        // 0: non-shareholder
        // 1: shareholder
        if (record.SHAREHOLDER_STATUS === 0) result["shareholder-status"]["non-shareholder"] += amount;
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
            const connSQL = await connectSQL();
            const connMySQL = await connectMySQL();
        } catch (error) {
            res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }
}

module.exports = new Details();
