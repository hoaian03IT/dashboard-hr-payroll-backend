const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { connectDB } = require("./src/db");

dotenv.config();
morgan("tiny");

const app = express();

const port = process.env.PORT || 3333;

connectDB(app);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
