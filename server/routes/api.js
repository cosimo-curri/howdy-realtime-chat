const express = require("express");
const router = express.Router();

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/users");
const usersController = require("../controllers/users");
const { createRateLimit } = require("../middleware/rateLimit");
const loginLimiter = createRateLimit({ windowMs: 5 * 60_000, max: 10 });
const signupLimiter = createRateLimit({ windowMs: 10 * 60_000, max: 5 });

const managePasswordRouter = require("./api_routes/managePassword");
const androidRouter = require("./api_routes/android");

const validators = require("../utils/validators");
const nodemailer = require("../utils/nodemailer");

////////////////////////////////////////////////////////////////////////////////
/// NOT USING req.isAuthenticated(), req.user, ETC. WITHOUT TOKEN VALIDATION ///
////////////////////////////////////////////////////////////////////////////////

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); //PASSPORT SERIALIZES THE MODEL "User", ENCRYPTS IT AND SENDS IT FOR COOKIES-STORAGE
passport.deserializeUser(User.deserializeUser()); //PASSPORT DESERIALIZES AND VERIFIES THE MODEL "User" SENT BY THE CLIENT TO THE SERVER

router.use("/managePassword", managePasswordRouter);
router.use("/android", androidRouter);

router.post("/signup", signupLimiter, validators.emailValidator, validators.strongPasswordValidator, usersController.signup, nodemailer.signupConfirmEmail);
router.post("/login", loginLimiter, usersController.login);
router.get("/logout", usersController.logout);

router.get("/activeUser/:activationToken", usersController.activeUser);

router.post("/isUserAuth2FA", loginLimiter, usersController.isUserAuth2FA);

module.exports = router;