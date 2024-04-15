const mongoose = require("mongoose");

const groupModuleSchema = new mongoose.Schema(
    {
        GROUP_MODULE_ID: { type: mongoose.Types.ObjectId, unique: true, default: new mongoose.Types.ObjectId() },
        GROUP_ID: { type: mongoose.Types.ObjectId, required: true, ref: "GROUP" },
        MODULE_ID: { type: mongoose.Types.ObjectId, required: true, ref: "MODULE" },
    },
    { timestamps: true, _id: false }
);

module.exports = new mongoose.model("GROUP_MODULE", groupModuleSchema);
