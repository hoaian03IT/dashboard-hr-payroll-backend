const mongoose = require("mongoose");

const userGroupSchema = new mongoose.Schema(
    {
        USER_GROUP: { type: mongoose.Types.ObjectId, default: new mongoose.Types.ObjectId(), unique: true },
        USER_ID: { type: mongoose.Types.ObjectId, required: true, ref: "USER" },
        GROUP_ID: { type: mongoose.Types.ObjectId, required: true, ref: "GROUP" },
    },
    {
        timestamps: true,
        _id: false,
    }
);

module.exports = new mongoose.model("USER_GROUP", userGroupSchema);
