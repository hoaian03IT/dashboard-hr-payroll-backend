const mongoose = require("mongoose");

const functionModel = new mongoose.Schema(
    {
        function_name: { type: String, required: true },
        is_active: { type: Boolean, required: true },
        module_id: { type: mongoose.Types.ObjectId, required: true, ref: "Module" },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

functionModel.virtual("function_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("Function", functionModel);
