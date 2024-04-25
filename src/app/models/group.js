const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        group_name: { type: String, required: true },
        description: { type: String, required: false, default: "" },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

groupSchema.virtual("group_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("Group", groupSchema);
