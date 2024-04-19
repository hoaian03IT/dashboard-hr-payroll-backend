const { connectSQL, connectMySQL } = require("../../db");

class Alert {
  async getHiring(req, res) {
    try {
      let { date } = req.query;
      const conn = await connectSQL();
      date = new Date(date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const sqlString =
        "select E.EMPLOYMENT_ID,(P.CURRENT_FIRST_NAME+' '+P.CURRENT_MIDDLE_NAME+' '+P.CURRENT_LAST_NAME) AS FULLNAME,E.HIRE_DATE_FOR_WORKING,YEAR(GETDATE())-YEAR(E.HIRE_DATE_FOR_WORKING) AS ANNIVESARY " +
        "from PERSONAL P INNER JOIN EMPLOYMENT E ON P.PERSONAL_ID=E.PERSONAL_ID " +
        `where MONTH(E.HIRE_DATE_FOR_WORKING) = ${month} AND DAY(E.HIRE_DATE_FOR_WORKING)= ${day} `;
      const result = await conn.request().query(sqlString);
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
      const conn = await connectMySQL();
      const [results, fields] = await conn.query("select * from Employee");
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
}

module.exports = new Alert();
