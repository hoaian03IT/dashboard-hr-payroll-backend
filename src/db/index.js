require("mssql");
const sql = require("mssql/msnodesqlv8");
const mongoose = require("mongoose");
const mysql = require("mysql2");

async function connectToHRDB() {
    let conn;
    const sqlConfig = {
        user: process.env.SQL_USERNAME,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB,
        server: process.env.SQL_SERVER,
        driver: "msnodesqlv8",

        options: {
            trustServerCertificate: true,
        },
    };
    try {
        conn = await new sql.ConnectionPool(sqlConfig).connect();
        console.log("Connect to SQL Server successfully");
    } catch (error) {
        console.error("Connect to SQL Server failed - " + error);
    }

    return conn;
}

async function connectToPayrollDB() {
    let conn;
    try {
        const mysqlConfig = {
            host: process.env.MYSQL_SERVER,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
        };
        conn = mysql.createConnection(mysqlConfig);
        console.log("Connect to MySQL successfully");
    } catch (error) {
        console.error("Connect to MySQL failed" + error.message);
    }
    return conn;
}

async function connectToMongoDB() {
    try {
        const stringConnection = process.env.MONGODB_STRING_CONNECTION;
        await mongoose.connect(stringConnection);
        console.log("Connect to MongoDB successfully");
    } catch (error) {
        console.error("Connect to MongoDB failed - " + error.message);
    }
}

async function connectDB(app) {
    await connectToMongoDB(app);
    const mySqlConn = await connectToPayrollDB();
    const sqlConn = await connectToHRDB();
    return { sqlConn, mySqlConn };
}

module.exports = { connectDB };
