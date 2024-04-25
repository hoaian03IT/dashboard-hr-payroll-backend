const mongoose = require("mongoose");

const userGroupSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
        group_id: { type: mongoose.Types.ObjectId, required: true, ref: "Group" },
    },
    { id: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userGroupSchema.virtual("user_group_id").get(function () {
    return this._id.toString();
});

module.exports = new mongoose.model("UserGroup", userGroupSchema);
