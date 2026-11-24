const express = require("express");
const router = express.Router();

router.use(express.static("public"));
const helpers = require("../../utils/helpers");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const { issueToken } = require("../../utils/authTokens");
const { disconnectAccount } = require("../../utils/socketConnections");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) => {
    const user = await helpers.userFindOrCreate(
        profile.given_name,
        profile.family_name,
        profile.email,
        profile.picture,
        { google: true }
    );

    return done(null, user);
}));

passport.serializeUser((user, done) => { //PASSPORT SERIALIZES THE MODEL "User", ENCRYPTS IT AND SENDS IT FOR COOKIES-STORAGE
    done(null, user);
});

passport.deserializeUser((user, done) => { //PASSPORT DESERIALIZES AND VERIFIES THE MODEL "User" SENT BY THE CLIENT TO THE SERVER
    done(null, user);
});

router.get("/", (req, res, next) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return res.status(503).json({ message: "GOOGLE_AUTH_UNAVAILABLE" });
    passport.authenticate("google", { scope: ["email", "profile"] })(req, res, next);
});

router.get("/callback", (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return res.status(503).json({ message: "GOOGLE_AUTH_UNAVAILABLE" });
    passport.authenticate("google", async (errors, user) => {
        let dataJSON = {};

        if(user && !user.auth2FA) {
            try {
            const signedToken = issueToken(user._id, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
            await helpers.changeCurrentToken(user._id, signedToken);
            disconnectAccount(req.app?.get?.("io"), user._id);
            await helpers.lastAccessUpdater(user._id);

            dataJSON = {
                message: "LOGIN_GOOGLE_OK",
                user: helpers.clientFilterUser(user),
                token: signedToken
            };
            } catch (_) { dataJSON = { message: "LOGIN_GOOGLE_ERROR" }; }
        } else {
            dataJSON = { message: "LOGIN_GOOGLE_ERROR" };
        }
    
        res.send(helpers.googleAuthCallback(dataJSON, process.env.REACT_APP_DOMAIN));
    })(req, res);
});

module.exports = router;