const mongoose = require("mongoose");

const userFunctionSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
        function_id: { type: mongoose.Types.ObjectId, required: true, ref: "Function" },
        is_active: { type: Boolean, required: true },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userFunctionSchema.virtual("user_function_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("UserFunction", userFunctionSchema);
