const express = require("express");
const router = express.Router();
const User = require("../models/users");
const jwt = require("jsonwebtoken");
const helpers = require("../utils/helpers");
const { tokenMatches } = require("../utils/authTokens");

router.use(async (req, res, next) => {
    const token = req.headers.token;
    if (!token || typeof token !== "string") return res.status(401).json({ message: "TOKEN_NOT_PROVIDED" });
    try {
        const payload = jwt.verify(token, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
        const user = await User.findById(payload.data);
        if (!user) return res.status(401).json({ message: "NO_USER_ACCOUNT" });
        if (!tokenMatches(user.currentValidToken, token)) {
            return res.status(401).json({ message: "USER_NOT_LOGGED" });
        }
        req.user = user;
        req.authToken = token;
        helpers.lastAccessUpdater(user._id).catch(() => {});
        next();
    } catch (_) {
        res.status(401).json({ message: "CANNOT_VERIFY_TOKEN" });
    }
});
router.use("/file", require("./tokenApi_routes/file"));
router.use("/profile", require("./tokenApi_routes/profile"));
router.use("/manageUsers", require("./tokenApi_routes/manageUsers"));
router.use("/android", require("./tokenApi_routes/android"));
router.use("/manageChats", require("./tokenApi_routes/manageChats"));
router.use("/manageStories", require("./tokenApi_routes/manageStories"));
module.exports = router;
