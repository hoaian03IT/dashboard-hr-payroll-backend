const mongoose = require("mongoose");

const userFunctionSchema = new mongoose.Schema(
    {
        USER_FUNCTION_ID: { type: mongoose.Types.ObjectId, unique: true, default: new mongoose.Types.ObjectId() },
        USER_ID: { type: mongoose.Types.ObjectId, required: true, ref: "USER" },
        FUNCTION_ID: { type: mongoose.Types.ObjectId, required: true, ref: "FUNCTION" },
        IS_ACTIVE: { type: Boolean, required: true },
    },
    { timestamps: true, _id: false }
);

module.exports = new mongoose.model("USER_FUNCTION", userFunctionSchema);
