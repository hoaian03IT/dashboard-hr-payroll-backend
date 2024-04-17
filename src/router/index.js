const alertRouter = require("./alert.router");
const summaryRouter = require("./summary.router");

function router(app) {
    app.use("/alert", alertRouter);
    app.use("/summary", summaryRouter);
}

module.exports = { router };
