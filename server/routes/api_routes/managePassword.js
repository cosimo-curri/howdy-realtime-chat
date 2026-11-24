const express = require("express");
const router = express.Router();

const User = require("../../models/users");

const jsonWebToken = require("jsonwebtoken");

const nodemailer = require("../../utils/nodemailer");
const { createRateLimit } = require("../../middleware/rateLimit");
const resetLimiter = createRateLimit({ windowMs: 10 * 60_000, max: 5 });

const validators = require("../../utils/validators");
const { validationResult } = require("express-validator");

//USING A MIDDLEWARE FROM nodemailer
router.post("/requestRestorePassword", resetLimiter, async (req, res, next) => {
    if(req.body.email) {
        User.findOne({ email: req.body.email })
            .then(async u => {
                if(u) {
                    req.body.username = u.username;

                    let changePasswordToken = jsonWebToken.sign({
                        data: req.body.email,
                        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
                    }, process.env.USER_CHANGE_PASSWORD_TOKEN_SECRET_ENCODING_PASSPHRASE);

                    u.changePasswordToken = changePasswordToken;
                    await u.save();

                    req.body.changePasswordToken = changePasswordToken;

                    next();
                } else
                    res.json({ message: "USER_NOT_FOUND" });
            })
            .catch(() => res.json({ message: "RESTORE_PASSWORD_ERROR" }));
    } else {
        res.json({ message: "RESTORE_PASSWORD_ERROR" });
    }
}, nodemailer.changePasswordRequest);

router.get("/restorePassword/:changePasswordToken", (req, res) => {
    try { jsonWebToken.verify(req.params.changePasswordToken,
        process.env.USER_CHANGE_PASSWORD_TOKEN_SECRET_ENCODING_PASSPHRASE); }
    catch (_) { return res.redirect("/error.html"); }
    User.findOne({ changePasswordToken: req.params.changePasswordToken })
        .then(u => {
            if(u)
                res.redirect(`/changePassword.html?changePasswordToken=${req.params.changePasswordToken}`);
            else
                res.redirect("/error.html");
        })
        .catch(() => res.redirect("/error.html"));
});

//MIDDLEWARE CHAIN
//MANAGED MULTIPLE VALIDATION ERRORS FOR POTENTIAL FUTURE CHECKS
router.post("/restorePassword", (req, res, next) => { //MIDDLEWARE #1
    if(req.body.changePasswordToken && req.body.password1 && req.body.password2) {
        if(req.body.password1 === req.body.password2) {
            req.body.password = req.body.password1;
            next();
        } else
            res.json({ message: "RESTORE_PASSWORD_ERROR" });
    } else {
        res.json({ message: "RESTORE_PASSWORD_ERROR" });
    }
}, validators.strongPasswordValidator, (req, res) => { //MIDDLEWARE #2 AND #3
    const errors = validationResult(req);

    const responseJSON = errors.errors.map(element => {
        return { message: element.msg }
    });

    if(responseJSON.length > 0)
        res.json(responseJSON);
    else {
        try {
            jsonWebToken.verify(req.body.changePasswordToken,
                process.env.USER_CHANGE_PASSWORD_TOKEN_SECRET_ENCODING_PASSPHRASE);
        } catch (_) { return res.json({ message: "RESTORE_PASSWORD_ERROR" }); }
        User.findOne({ changePasswordToken: req.body.changePasswordToken })
            .then(u => {
                if(u) {
                    u.changePasswordToken = null;
                    u.setPassword(req.body.password, async (error) => {
                        if (error) return res.json({ message: "RESTORE_PASSWORD_ERROR" });
                        try {
                            u.currentValidToken = null;
                            await u.save();
                            res.json({ message: "RESTORE_PASSWORD_OK" });
                        } catch (_) { res.json({ message: "RESTORE_PASSWORD_ERROR" }); }
                    });
                } else
                    res.json({ message: "RESTORE_PASSWORD_ERROR" });
            })
            .catch(() => res.json({ message: "RESTORE_PASSWORD_ERROR" }));
    }
});

module.exports = router;