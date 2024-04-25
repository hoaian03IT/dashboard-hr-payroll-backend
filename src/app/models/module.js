const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
    {
        module_name: { type: String, required: true },
        description: { type: String, required: false, default: "" },
        is_active: { type: Boolean, required: true },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

moduleSchema.virtual("module_id").get(function () {
    return this._id;
});

module.exports = new mongoose.model("Module", moduleSchema);
