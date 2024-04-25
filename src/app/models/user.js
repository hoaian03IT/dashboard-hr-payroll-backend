const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        first_name: { type: String, required: true },
        middle_initial: { type: String, default: "" },
        last_name: { type: String, required: true },
        gender: { type: String, required: true },
        phone_number: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
    },
    {
        id: false,
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

userSchema.virtual("user_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("User", userSchema);
