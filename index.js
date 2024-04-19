const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { connectSQL, connectMongoDB, connectMySQL } = require("./src/db");
const { router } = require("./src/router");
const cors = require("cors");

dotenv.config();
morgan("tiny");

const app = express();
const port = process.env.PORT || 3333;

const corsOption = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOption));

connectMongoDB();
connectSQL();
connectMySQL();

router(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
