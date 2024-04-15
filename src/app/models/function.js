const mongoose = require("mongoose");

const functionModel = new mongoose.Schema(
    {
        FUNCTION_ID: { type: mongoose.Types.ObjectId, default: new mongoose.Types.ObjectId(), unique: true },
        FUNCTION_NAME: { type: String, required: true },
        IS_ACTIVE: { type: Boolean, required: true },
        MODULE_ID: { type: mongoose.Types.ObjectId, required: true, ref: "MODULE" },
    },
    {
        timestamps: true,
        _id: false,
    }
);

module.exports = new mongoose.model("FUNCTION", functionModel);
