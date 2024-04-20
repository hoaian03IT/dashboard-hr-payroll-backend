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
        } catch (error) {}
    }

    async getEarningByShareholder(req, res) {
        try {
            const conn = await connectSQL();
            const [rows] = await conn.request.query();
        } catch (error) {}
    }
}

module.exports = new Summary();
