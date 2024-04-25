const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
    {
        refresh_token_value: { type: String, required: true },
        user_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

refreshTokenSchema.virtual("refresh_token_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("RefreshToken", refreshTokenSchema);
