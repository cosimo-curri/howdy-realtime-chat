const express = require("express");
const router = express.Router();
const users = require("../../controllers/users");
const { createRateLimit } = require("../../middleware/rateLimit");
const deviceLimiter = createRateLimit({ windowMs: 60_000, max: 60 });
router.post("/session", deviceLimiter, users.androidDeviceSession);
router.put("/setCode2FA", deviceLimiter, users.setCode2FA);
router.post("/logout", users.androidDeviceLogout);
module.exports = router;
