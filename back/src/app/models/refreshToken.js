const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
    {
        REFRESH_TOKEN_ID: { type: mongoose.Types.ObjectId, unique: true, default: new mongoose.Types.ObjectId() },
        REFRESH_TOKEN_VALUE: { type: String, required: true },
        USER_ID: { type: mongoose.Types.ObjectId, required: true, ref: "USER" },
    },
    { timestamps: true, _id: false }
);

module.exports = new mongoose.model("REFRESH_TOKEN", refreshTokenSchema);
