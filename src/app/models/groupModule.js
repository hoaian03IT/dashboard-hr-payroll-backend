const mongoose = require("mongoose");

const groupModuleSchema = new mongoose.Schema(
    {
        group_id: { type: mongoose.Types.ObjectId, required: true, ref: "Group" },
        module_id: { type: mongoose.Types.ObjectId, required: true, ref: "Module" },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

groupModuleSchema.virtual("group_module_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("GroupModule", groupModuleSchema);
