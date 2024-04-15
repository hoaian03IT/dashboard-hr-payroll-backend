const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        USER_ID: { type: mongoose.Types.ObjectId, default: new mongoose.Types.ObjectId(), unique: true },
        USERNAME: { type: String, required: true },
        PASSWORD: { type: String, required: true },
        FIRST_NAME: { type: String, required: true },
        MIDDLE_INITIAL: { type: String, required: true },
        LAST_NAME: { type: String, required: true },
        GENDER: { type: String, required: true },
        PHONE_NUMBER: { type: String, required: true },
        EMAIL: { type: String, required: true },
    },
    {
        timestamps: true,
        _id: false,
    }
);

module.exports = new mongoose.model("USER", userSchema);
