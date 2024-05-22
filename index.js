const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectMongoDB, connectMySQL, connectSQL } = require("./src/db");
const { router } = require("./src/router");
dotenv.config();
morgan("tiny");

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser());

const corsOption = {
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionSuccessStatus: 200,
};
app.use(cors(corsOption));

connectMongoDB();

router(app);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
