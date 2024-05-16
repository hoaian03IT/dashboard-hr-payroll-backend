require("mssql");
const sql = require("mssql/msnodesqlv8");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");

async function connectMySQL() {
    let conn;
    try {
        const mysqlConfig = {
            host: process.env.MYSQL_SERVER,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
            waitForConnections: true,
            connectionLimit: 10,
            idleTimeout: 60000,
        };
        conn = await mysql.createConnection(mysqlConfig);
    } catch (error) {
        console.error("Connect to MySQL failed" + error.message);
    }
    return conn;
}

async function connectMongoDB() {
    try {
        const stringConnection = process.env.MONGODB_STRING_CONNECTION;
        await mongoose.connect(stringConnection);
        console.log("Connect to MongoDB successfully");
    } catch (error) {
        console.error("Connect to MongoDB failed - " + error.message);
    }
}

async function connectSQL() {
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
    } catch (error) {
        console.error("Connect to SQL Server failed - " + error);
    }
    return conn;
}

module.exports = { connectMySQL, connectMongoDB, connectSQL };
