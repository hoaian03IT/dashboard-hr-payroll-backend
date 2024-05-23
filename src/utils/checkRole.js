const { userModel, userGroupModel, groupModuleModel } = require("../app/models");

const checkRole = async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const userGroup = await userGroupModel.findOne({ user_id });

        const group_id = userGroup.group_id;
        const groupModule = await groupModuleModel.find({ group_id });
        console.log(groupModule);

        next();
    } catch (error) {
        res.status(500).json({ title: "Error", message: error.message });
    }
};

module.exports = checkRole;
