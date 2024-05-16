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

module.exports = {
    ensureMySQLViewExists,
    ensureSQLViewExists,
};
