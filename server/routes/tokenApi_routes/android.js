const express = require("express");
const router = express.Router();

const usersController = require("../../controllers/users");
const nodemailer = require("../../utils/nodemailer");
const { createRateLimit } = require("../../middleware/rateLimit");
const enrollmentLimiter = createRateLimit({ windowMs: 10 * 60_000, max: 5 });

router.post("/sendAndroidRandomAuthCode", enrollmentLimiter, nodemailer.sendAndroidRandomAuthCode);

//FOR DISABLING THE AUTH 2FA THERE'S A MECHANISM IN THE LOGOUT ROUTE
router.put("/enableAuth2FA", enrollmentLimiter, usersController.enableAuth2FA);

module.exports = router;