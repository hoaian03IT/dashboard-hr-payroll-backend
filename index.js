const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { connectMongoDB } = require("./src/db");
const { router } = require("./src/router");

dotenv.config();
morgan("tiny");

const app = express();
const port = process.env.PORT || 3333;

connectMongoDB();

router(app);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
