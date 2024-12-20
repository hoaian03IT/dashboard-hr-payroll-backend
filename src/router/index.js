const alertRouter = require("./alert.router");
const summaryRouter = require("./summary.router");
const authRouter = require("./auth.router");
const detailsRouter = require("./details.router");
const employeeRouter = require("./employee.router");

function router(app) {
    app.use("/alert", alertRouter);
    app.use("/summary", summaryRouter);
    app.use("/auth", authRouter);
    app.use("/details", detailsRouter);
    app.use("/employee", employeeRouter);
}

module.exports = { router };
