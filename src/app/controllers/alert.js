const { connectSQL, connectMySQL } = require("../../db");

class Alert {
    async getHiring(req, res) {
        try {
            let { date, year } = req.query;
            const conn = await connectSQL();
            date = new Date(date);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const sqlString =
                `select P.CURRENT_FIRST_NAME,P.CURRENT_LAST_NAME,(P.CURRENT_FIRST_NAME+' '+P.CURRENT_LAST_NAME) AS FULLNAME,E.EMPLOYMENT_ID,E.HIRE_DATE_FOR_WORKING,(${year}-YEAR(E.HIRE_DATE_FOR_WORKING)) AS ANNIVESARY ` +
                "from PERSONAL P INNER JOIN EMPLOYMENT E ON P.PERSONAL_ID=E.PERSONAL_ID " +
                `where MONTH(E.HIRE_DATE_FOR_WORKING) = ${month} AND DAY(E.HIRE_DATE_FOR_WORKING)= ${day} and (${year}-YEAR(E.HIRE_DATE_FOR_WORKING))>0`;
            const result = await conn.request().query(sqlString);
            conn.close();
            return res.status(200).json({
                data: result.recordset,
            });
        } catch (error) {
            return res.status(500).json({
                title: "Lỗi",
                message: error.message,
            });
        }
    }
    async getVacationDate(req, res) {
        try {
            const MAX_VACATION_DAYS = 5;
            const conn = await connectMySQL();
            const [results] = await conn.query(
                "SELECT `First Name` AS FIRSTNAME, `Last Name`AS LASTNAME,idEmployee,`Vacation Days` AS VACATIONDAYS,ABS( `Vacation Days`-" +
                    `${MAX_VACATION_DAYS}) AS OVERDAYS  FROM Employee WHERE ` +
                    `\`Vacation Days\`>${MAX_VACATION_DAYS}`
            );

            conn.close();
            return res.status(200).json({
                data: results,
            });
        } catch (error) {
            return res.status(500).json({
                title: "Lỗi",
                message: error.message,
            });
        }
    }

    async getBirthdayAnniversary(req, res) {
        try {
            const { month, year } = req.query;

            if (!month) {
                return res.status(403).json({ title: "Error", message: "Invalid month" });
            }
            const conn = await connectSQL();
            const results = await conn
                .request()
                .query(
                    `SELECT (CURRENT_FIRST_NAME+' '+ CURRENT_LAST_NAME) AS FULLNAME, EMPLOYMENT_ID, BIRTH_DATE, CURRENT_GENDER, CURRENT_PERSONAL_EMAIL, CURRENT_PHONE_NUMBER, (${year}-YEAR(BIRTH_DATE)) AS AGE FROM PERSONAL P, EMPLOYMENT E ` +
                        `WHERE P.PERSONAL_ID=E.PERSONAL_ID AND E.TERMINATION_DATE IS NULL AND MONTH(BIRTH_DATE)=${month} and  (${year}-YEAR(BIRTH_DATE))>18`
                );
            return res.status(200).json({
                data: results.recordset,
            });
        } catch (error) {
            return res.status(500).json({
                title: "Error",
                message: error.message,
            });
        }
    }
}

module.exports = new Alert();
