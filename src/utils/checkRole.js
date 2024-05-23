const { userModel, userGroupModel, groupModuleModel, groupModel } = require("../app/models");

const ensureAdmin = async (user_id) => {
    let ensureAd = false;
    try {
        const adminGroup = await groupModel.findOne({ group_name: "admin" });

        ensureAd = await userGroupModel.findOne({ user_id: user_id, group_id: adminGroup._id });
    } catch (error) {
        res.status(500).json({ title: "Error", message: error.message });
    }
    return ensureAd;
};

const ensureHR = async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const adminGroup = await groupModel.findOne({ group_name: "hr" });

        const isAdmin = ensureAdmin(user_id);

        const isHR = await userGroupModel.exist({ user_id: user_id, group_id: adminGroup._id });

        if (!isAdmin && !isHR) {
            return res.status(403).json({
                title: "Error",
                message: "You don't have permission to access this page",
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ title: "Error", message: error.message });
    }
};

const ensurePR = async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const adminGroup = await groupModel.findOne({ group_name: "pr" });

        const isAdmin = ensureAdmin(user_id);

        const isPR = await userGroupModel.exist({ user_id: user_id, group_id: adminGroup._id });

        if (!isAdmin && !isPR) {
            return res.status(403).json({
                title: "Error",
                message: "You don't have permission to access this page",
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ title: "Error", message: error.message });
    }
};

module.exports = { ensureHR, ensurePR };
