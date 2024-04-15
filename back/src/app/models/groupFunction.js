const mongoose = require("mongoose");

const groupFunctionSchema = new mongoose.Schema(
    {
        GROUP_FUNCTION_ID: { type: mongoose.Types.ObjectId, unique: true, default: new mongoose.Types.ObjectId() },
        GROUP_ID: { type: mongoose.Types.ObjectId, required: true, ref: "GROUP" },
        FUNCTION_ID: { type: mongoose.Types.ObjectId, required: true, ref: "FUNCTION" },
    },
    { timestamps: true, _id: false }
);

module.exports = new mongoose.model("GROUP_FUNCTION", groupFunctionSchema);
