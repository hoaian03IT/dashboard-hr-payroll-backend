const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
    {
        MODULE_ID: { type: mongoose.Types.ObjectId, default: new mongoose.Types.ObjectId(), unique: true },
        MODULE_NAME: { type: String, required: true },
        DESCRIPTION: { type: String, required: false, default: "" },
        IS_ACTIVE: { type: Boolean, required: true },
    },
    {
        timestamps: true,
        _id: false,
    }
);

module.exports = new mongoose.model("MODULE", moduleSchema);
