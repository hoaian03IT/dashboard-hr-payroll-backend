const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        GROUP_ID: { type: mongoose.Types.ObjectId, default: new mongoose.Types.ObjectId(), unique: true },
        GROUP_NAME: { type: String, required: true },
        DESCRIPTION: { type: String, required: false, default: "" },
    },
    {
        timestamps: true,
        _id: false,
    }
);

module.exports = new mongoose.model("GROUP", groupSchema);
