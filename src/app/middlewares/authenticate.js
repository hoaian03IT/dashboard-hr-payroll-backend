const jwt = require("jsonwebtoken");

async function authenticate(req, res, next) {
    try {
        const token = req.headers["authorization"].split(" ")[1];
        if (!token) return res.status(403).json({ title: "Error", message: "Empty token" });
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
            if (err) {
                return res.status(403).json({ title: "Error", message: "Invalid token" });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        res.status(500).json({ title: "Error", message: error.message });
    }
}

module.exports = authenticate;
