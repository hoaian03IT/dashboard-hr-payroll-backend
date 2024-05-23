const mongoose = require("mongoose");

const groupFunctionSchema = new mongoose.Schema(
    {
        group_id: { type: mongoose.Types.ObjectId, required: true, ref: "Group" },
        function_id: { type: mongoose.Types.ObjectId, required: true, ref: "Function" },
        is_active: { type: Boolean, required: true },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

groupFunctionSchema.virtual("group_function_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("GroupFunction", groupFunctionSchema);
