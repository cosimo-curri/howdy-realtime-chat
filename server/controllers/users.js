const passport = require("passport");
const crypto = require("node:crypto");
const { disconnectAccount } = require("../utils/socketConnections");
const User = require("../models/users");

const moment = require("moment");

const jsonWebToken = require("jsonwebtoken");
const { issueToken, issueDeviceToken, deviceTokenHash, tokenMatches, codeHash } = require("../utils/authTokens");

const { validationResult } = require("express-validator");

const helpers = require("../utils/helpers");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//THE SECRET ENCODING PASSPHRASE IS DIFFERENT FOR THE LOGIN
exports.signup = (req, res, next) => {
    const errors = validationResult(req);

    if(errors.errors[0])
        res.json({ message: errors.errors[0].msg });
    else {
        let activationToken = jsonWebToken.sign({
            data: req.body.email,
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
        }, process.env.USER_ACTIVATION_TOKEN_SECRET_ENCODING_PASSPHRASE);

        //FOR THE NEXT MIDDLEWARE
        req.body.activationToken = activationToken;

        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username.toLowerCase(),
            email: req.body.email.toLowerCase(),
            profilePictureURL: `${process.env.BASE_URL}/default/user_male.png`,
            signupMethod: {
                local: true
            },
            secureSignUp: {
                activationToken: activationToken
            }
        });
    
        User.register(newUser, req.body.password, (error, user) => {
            if(user) {
                helpers.lastAccessUpdater(user._id).catch(() => {});
                next();
            } else {
                res.json({ message: error.name }); //UserExistsError USERNAME USED, MongoServerError E-MAIL USED, ValidationError WHEN IS NOT PROVIDED REQUIRED DATA 
            }
        });
    }
};

//ALLOWING USERS TO AUTHENTICATE WITH BOTH USERNAME AND E-MAIL
//IF I DON'T SEND THE JSON WITH THE USER INFO THE SERVER CAN'T RESPONDE WITH THE HEADER Set-Cookie SO THE CLIENT CAN'T BE LOGGED
exports.login = async (req, res) => {
    if (req.body.challenge) return exports.completeTwoFactorLogin(req, res);
    try {
        if (req.body.email) {
            const byEmail = await User.findOne({ email: String(req.body.email).toLowerCase() });
            if (byEmail) req.body.username = byEmail.username;
        }
        passport.authenticate("local", async (_error, user) => {
            if (!user) return res.json({ message: "LOGIN_ERROR" });
            if (!user.secureSignUp.active) return res.json({ message: "USER_NOT_ACTIVE" });

            const androidEnrollment = req.body.clientType === "ANDROID_2FA_APP";
            if (androidEnrollment && user.auth2FA) {
                // A password must never re-enroll another authenticator while 2FA is active.
                return res.json({ message: "AUTH_2FA_ERROR" });
            }
            // A protected account cannot complete password-only login.
            // Web 2FA uses the separate, single-use challenge below.
            if (!androidEnrollment && user.auth2FA) {
                return res.json({ message: "AUTH_2FA_ERROR" });
            }

            try {
                const signedToken = issueToken(user._id, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
                user.currentValidToken = signedToken;
                user.lastAccess = new Date();
                let mobileToken;
                if (androidEnrollment) {
                    mobileToken = issueDeviceToken();
                    user.androidDeviceTokenHash = deviceTokenHash(mobileToken);
                }
                await user.save();
                disconnectAccount(req.app?.get?.("io"), user._id);
                const dataJSON = { message: "LOGIN_OK", user: helpers.clientFilterUser(user), token: signedToken };
                if (mobileToken) dataJSON.deviceToken = mobileToken;
                res.json(dataJSON);
            } catch (_) { res.json({ message: "LOGIN_ERROR" }); }
        })(req, res);
    } catch (_) { res.json({ message: "LOGIN_ERROR" }); }
};

// Start web 2FA only after checking the password. The browser retains a
// short-lived random challenge, never a copy of the account password.
exports.isUserAuth2FA = async (req, res) => {
    if (!(req.body.email || req.body.username) || !req.body.password) {
        return res.json({ message: "IS_USER_AUTH_2FA_ERROR" });
    }
    try {
        if (req.body.email) {
            const account = await User.findOne({ email: String(req.body.email).toLowerCase() });
            if (account) req.body.username = account.username;
        }
        passport.authenticate("local", async (_error, user) => {
            if (!user || !user.secureSignUp?.active) {
                return res.json({ message: "USER_NOT_FOUND" });
            }
            if (!user.auth2FA) return res.json({ message: "AUTH_2FA_NO" });
            try {
                const challenge = crypto.randomBytes(32).toString("hex");
                const expiresAt = new Date(Date.now() + 5 * 60_000);
                const result = await User.updateOne({ _id: user._id, auth2FA: true }, { $set: {
                    pending2FAChallengeHash: deviceTokenHash(challenge),
                    pending2FAChallengeExpiresAt: expiresAt
                } });
                if (result.matchedCount === 0) return res.json({ message: "IS_USER_AUTH_2FA_ERROR" });
                res.json({ message: "AUTH_2FA_YES", challenge });
            } catch (_) { res.json({ message: "IS_USER_AUTH_2FA_ERROR" }); }
        })(req, res);
    } catch (_) { res.json({ message: "IS_USER_AUTH_2FA_ERROR" }); }
};

// A single conditional MongoDB update consumes BOTH the login challenge and
// the rotating code, so concurrent requests cannot reuse either credential.
exports.completeTwoFactorLogin = async (req, res) => {
    const challenge = String(req.body.challenge || "");
    const code = String(req.body.code2FA || "");
    if (!/^[a-f0-9]{64}$/.test(challenge) || !/^\d{6}$/.test(code)) {
        return res.json({ message: "AUTH_2FA_ERROR" });
    }
    try {
        const now = new Date();
        const digest = deviceTokenHash(challenge);
        const verified = await User.findOneAndUpdate({
            pending2FAChallengeHash: digest,
            pending2FAChallengeExpiresAt: { $gt: now },
            auth2FA: true,
            "secureSignUp.active": true,
            "code2FA.value": codeHash(code, process.env.AUTH_SECRET_ENCODING_PASSPHRASE),
            "code2FA.date": { $gte: new Date(now.getTime() - 60_000), $lte: now },
            $or: [{ auth2FALockedUntil: null }, { auth2FALockedUntil: { $lte: now } }]
        }, {
            $set: { "code2FA.value": null, "code2FA.date": null,
                failed2FAAttempts: 0, auth2FALockedUntil: null },
            $unset: { pending2FAChallengeHash: "", pending2FAChallengeExpiresAt: "" }
        }, { new: true });
        if (!verified) {
            const failed = await User.findOneAndUpdate({
                pending2FAChallengeHash: digest,
                pending2FAChallengeExpiresAt: { $gt: now }, auth2FA: true,
                $or: [{ auth2FALockedUntil: null }, { auth2FALockedUntil: { $lte: now } }]
            }, { $inc: { failed2FAAttempts: 1 } }, { new: true });
            if (failed && failed.failed2FAAttempts >= 5) {
                await User.updateOne({ _id: failed._id, failed2FAAttempts: { $gte: 5 } }, {
                    $set: { auth2FALockedUntil: new Date(now.getTime() + 15 * 60_000),
                        failed2FAAttempts: 0 }
                });
            }
            return res.json({ message: "AUTH_2FA_ERROR" });
        }
        const signedToken = issueToken(verified._id, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
        verified.currentValidToken = signedToken;
        verified.lastAccess = now;
        await verified.save();
        disconnectAccount(req.app?.get?.("io"), verified._id);
        res.json({ message: "LOGIN_OK", user: helpers.clientFilterUser(verified), token: signedToken });
    } catch (_) { res.json({ message: "AUTH_2FA_ERROR" }); }
};

exports.loggedUserAuth2FA = (req, res) => {
    req.user.auth2FA ? res.json({ message: "AUTH_2FA_YES" }) : res.json({ message: "AUTH_2FA_NO" });
};

exports.logout = async (req, res) => {
    const token = req.headers.token;
    if (!token || typeof token !== "string") return res.status(401).json({ message: "TOKEN_NOT_PROVIDED" });
    try {
        const payload = jsonWebToken.verify(token, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
        const user = await User.findById(payload.data);
        if (!user || !tokenMatches(user.currentValidToken, token)) {
            return res.status(401).json({ message: "USER_NOT_LOGGED" });
        }
        user.currentValidToken = null;
        await user.save();
        disconnectAccount(req.app?.get?.("io"), user._id);
        if (req.logout && req.isAuthenticated && req.isAuthenticated()) {
            req.logout(() => {});
        }
        res.json({ message: "LOGOUT_OK" });
    } catch (_) { res.status(401).json({ message: "USER_NOT_LOGGED" }); }
};

//SETTING secureSignUp.activationToken TO undefined INSTEAD OF null ALLOWS TO DELETE THE ATTRIBUTE FROM THE DOCUMENT
exports.activeUser = (req, res) => {
    try {
        jsonWebToken.verify(req.params.activationToken, process.env.USER_ACTIVATION_TOKEN_SECRET_ENCODING_PASSPHRASE);
    } catch (_) { return res.redirect("/error.html"); }
    User.findOne({ "secureSignUp.activationToken": req.params.activationToken })
        .then(async u => {
            if(u) {
                await User.findOneAndUpdate({ _id: u._id }, {
                    "secureSignUp.activationToken": null, "secureSignUp.active": true
                });

                res.redirect("/signup_confirm.html");
            } else
                res.redirect("/error.html");
        })
        .catch(() => res.redirect("/error.html"));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// NEXT 2 MIDDLEWARES FOR CHECKING AUTHENTICATION TYPE, USABLE IN MIDDLEWARE CHAINS FROM tokenApi ROUTE ///
////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.onlyLocalAuth = (req, res, next) => {
    if (req.user.signupMethod.local) next();
    else res.status(403).json({ message: "LOCAL_AUTH_REQUIRED" });
};

exports.onlyGoogleAuth = (req, res, next) => {
    if (req.user.signupMethod.google) next();
    else res.status(403).json({ message: "GOOGLE_AUTH_REQUIRED" });
};

//SEARCH BY BOTH USERNAME AND E-MAIL
//CHECK CLIENT-SIDE INSTEAD OF SERVER-SIDE BECAUSE THE ERROR WILL BE CLIENT-SIDE WITHOUT AFFECTING SERVER
exports.findUser = (req, res) => {
    const value = String(req.params.value || "");
    if (value.length > 64) return res.status(400).json({ message: "FIND_USER_QUERY_ERROR" });
    const safeValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    //ONLY THE FIRST 5 OCCURRENCES
    const searchQuery = User.find({
        $or: [
            {
                username: {
                    $regex: `^${safeValue}`,
                    $options: "i"
                }
            },
            {
                email: {
                    $regex: `^${safeValue}`,
                    $options: "i"
                }
            }
        ]
    })
    .where({ username: { $ne: req.user.username } }) //EXCLUDING LOGGED USER FROM THE QUERY
    .limit(5);

    searchQuery.exec()
        .then(async users => {
            const filteredUsersPromises = users.map(async element => {
                const isAlreadyFriendOrRequest = await helpers.isAlreadyFriendOrRequest(req.user._id, element._id);

                return { _id: element._id, username: element.username, profilePictureURL: element.profilePictureURL, isAlreadyFriendOrRequest: isAlreadyFriendOrRequest.message }
            });
            
            const filteredUsers = await Promise.all(filteredUsersPromises);

            res.json(filteredUsers);
        })
        .catch(() => {
            res.json({ message: "FIND_USER_QUERY_ERROR" });
        })
};

//DON'T CHECK IF BODY CONTAINS NOT REQUIRED FIELD
exports.changeUserInfo = async (req, res) => {
    if(req.body.firstName && req.body.lastName && req.body.username) {
        const dataJSON = [];

        req.user.firstName = req.body.firstName;
        req.user.lastName = req.body.lastName;
        
        if(req.body.gender !== "")
            req.user.gender = req.body.gender;
        
        if(req.body.birthday !== "Invalid date")
            req.user.birthday = req.body.birthday;
        
        req.user.contacts.instagram = req.body.instagram;
        req.user.contacts.facebook = req.body.facebook;
        req.user.contacts.linkedin = req.body.linkedin;
        
        if(req.user.profilePictureURL === `${process.env.BASE_URL}/default/user_male.png` || req.user.profilePictureURL === `${process.env.BASE_URL}/default/user_female.png`)
            helpers.applyDefaultProfilePicture(req);
        
        await req.user.save() //SAVING firstName AND lastName REGARDLESS
            .then(() => dataJSON.push({ message1: "OTHER_FIELDS_OK" }))
            .catch((e) => dataJSON.push({ message1: e }))
        
        req.user.username = req.body.username.toLowerCase();
        
        //IF THE NEW USERNAME IS EQUALS TO THE CURRENT USERNAME THERE'S NO ERROR
        await req.user.save()
            .then(() => dataJSON.push({ message2: "USERNAME_OK" }))
            .catch((e) => dataJSON.push({ message2: e }))
        
        dataJSON.push({
            userInfo: helpers.clientFilterUser(req.user)
        });

        res.json(dataJSON);
    } else
        res.json({ message: "CHANGE_USER_INFO_ERROR" });
};

//EXPORTS MIDDLEWARE CHAIN (FOR CLEANING CODE IN tokenApi)
//MANAGED MULTIPLE VALIDATION ERRORS FOR POTENTIAL FUTURE CHECKS
exports.changePassword = {
    firstStep: (req, res, next) => {
        if(req.body.currentPassword && req.body.newPassword1 && req.body.newPassword2) {
            if(req.body.newPassword1 !== req.body.newPassword2)
                res.json({ message: "CHANGE_PASSWORD_ERROR" });
            else {
                req.body.password = req.body.newPassword1;

                req.user.authenticate(req.body.currentPassword, (error, model, passwordError) => {
                    error ? res.json({ message: "CHANGE_PASSWORD_ERROR" }) :
                    passwordError ? res.json({ message: "CURRENT_PASSWORD_ERROR" }) :
                    next()
                });
            }
        } else
            res.json({ message: "CHANGE_PASSWORD_ERROR" });
    },
    stepAfterPasswordValidation: (req, res, next) => {
        const errors = validationResult(req);

        const responseJSON = errors.errors.map(element => {
            return { message: element.msg }
        });

        if(responseJSON.length > 0)
            res.json(responseJSON);
        else {
            req.user.setPassword(req.body.password, () => {
                req.user.save()
                    .then(() => {
                        req.headers.userid = req.user._id;
                        next();
                    })
                    .catch(() => res.json({ message: "CHANGE_PASSWORD_ERROR" }));
            });
        }
    }
};

//CHECK CLIENT-SIDE INSTEAD OF SERVER-SIDE BECAUSE THE ERROR WILL BE CLIENT-SIDE WITHOUT AFFECTING SERVER
exports.getUserByUsername = (req, res) => {
    const username = req.params.username;
    
    User.findOne({ username: username })
        .then(async u => {
            if(u) {
                if(u._id.equals(req.user._id))
                    res.json({ message: "YOU" });
                else {
                    let dataJSON = helpers.publicFilterUser(u);
                    dataJSON.isAlreadyFriendOrRequest = await helpers.isAlreadyFriendOrRequest(req.user._id, u._id);

                    res.json(dataJSON);
                }
            } else
                res.json({ message: "USER_NOT_FOUND" });
        })
        .catch(() => res.json({ message: "FIND_USER_QUERY_ERROR" }));
};

exports.getUserById = (req, res) => {
    const userId = req.params.userId;

    User.findById(userId)
        .then(async u => {
            if(u) {
                if(u._id.equals(req.user._id))
                    res.json({ message: "YOU" });
                else {
                    let dataJSON = helpers.publicFilterUser(u);
                    dataJSON.isAlreadyFriendOrRequest = await helpers.isAlreadyFriendOrRequest(req.user._id, u._id);

                    res.json(dataJSON);
                }
            } else
                res.json({ message: "USER_NOT_FOUND" });
        })
        .catch(() => res.json({ message: "FIND_USER_QUERY_ERROR" }));
};

exports.changeDarkTheme = (req, res) => {
    if(typeof req.body.darkTheme === "boolean" || req.body.darkTheme === true || req.body.darkTheme === false) {
        req.user.darkTheme = req.body.darkTheme;
        
        req.user.save()
            .then(() => res.json({ message: "CHANGE_DARK_THEME_OK" }))
            .catch(() => res.json({ message: "CHANGE_DARK_THEME_ERROR" }));
    } else
        res.json({ message: "CHANGE_DARK_THEME_ERROR" });
};

exports.enableAuth2FA = async (req, res) => {
    const code = req.body.enrollmentCode;
    if (req.user.enrollmentLockedUntil && new Date(req.user.enrollmentLockedUntil).getTime() > Date.now()) {
        return res.status(403).json({ message: "ENABLE_AUTH_2FA_ERROR" });
    }
    const hasChallenge = req.user.androidEnrollmentCodeHash && req.user.androidEnrollmentCodeExpiresAt &&
        Date.now() <= new Date(req.user.androidEnrollmentCodeExpiresAt).getTime();
    const valid = /^[0-9]{6}$/.test(String(code || "")) && hasChallenge &&
        tokenMatches(req.user.androidEnrollmentCodeHash,
            codeHash(code, process.env.AUTH_SECRET_ENCODING_PASSPHRASE));
    if (!req.user.androidDeviceTokenHash || !valid) {
        req.user.failedEnrollmentAttempts = (req.user.failedEnrollmentAttempts || 0) + 1;
        if (req.user.failedEnrollmentAttempts >= 5) {
            req.user.enrollmentLockedUntil = new Date(Date.now() + 15 * 60_000);
            req.user.failedEnrollmentAttempts = 0;
        }
        try { await req.user.save(); } catch (_) {}
        return res.status(403).json({ message: "ENABLE_AUTH_2FA_ERROR" });
    }
    try {
        req.user.failedEnrollmentAttempts = 0;
        req.user.enrollmentLockedUntil = null;
        req.user.auth2FA = true;
        req.user.androidEnrollmentCodeHash = null;
        req.user.androidEnrollmentCodeExpiresAt = null;
        await req.user.save();
        res.json({ message: "ENABLE_AUTH_2FA_OK" });
    } catch (_) { res.json({ message: "ENABLE_AUTH_2FA_ERROR" }); }
};

//IF USER CLOSE APP OR THE APP LOST THE INTERNET CONNECTION THERE IS A SYSTEM FOR CHECKING THE DATE
//I HAVE TO FIND USER BY ID (IS AN /api ROUTE AND NOT A /tokenApi ROUTE)
//USERNAME IN THE RESPONSE IF THE USER CHANGE IT (WITH THE E-MAIL ISN'T POSSIBLE)
async function authenticatedAndroidDevice(deviceToken) {
    if (typeof deviceToken !== "string" || !/^[a-f0-9]{64}$/.test(deviceToken)) return null;
    const tokenDigest = deviceTokenHash(deviceToken);
    return User.findOne({ androidDeviceTokenHash: tokenDigest });
}

exports.androidDeviceSession = async (req, res) => {
    try {
        const user = await authenticatedAndroidDevice(req.body.deviceToken);
        if (!user || !user.auth2FA) return res.status(401).json({ message: "LOGIN_ERROR" });
        res.json({ message: "LOGIN_OK", user: helpers.clientFilterUser(user) });
    } catch (_) { res.json({ message: "LOGIN_ERROR" }); }
};

exports.setCode2FA = async (req, res) => {
    try {
        const user = await authenticatedAndroidDevice(req.body.deviceToken);
        if (!user || !user.auth2FA || !/^\d{6}$/.test(String(req.body.code2FA || ""))) {
            return res.status(401).json({ message: "SET_CODE_2FA_ERROR" });
        }
        user.code2FA.value = codeHash(req.body.code2FA, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
        user.code2FA.date = new Date();
        await user.save();
        res.json({ message: "SET_CODE_2FA_OK", username: user.username, profilePictureURL: user.profilePictureURL });
    } catch (_) { res.json({ message: "SET_CODE_2FA_ERROR" }); }
};

exports.androidDeviceLogout = async (req, res) => {
    try {
        const user = await authenticatedAndroidDevice(req.body.deviceToken);
        if (!user) return res.status(401).json({ authResult: "AUTH_2FA_DISABLE_ERROR" });
        user.androidDeviceTokenHash = null;
        user.auth2FA = false;
        user.code2FA.value = null;
        user.code2FA.date = null;
        user.failed2FAAttempts = 0;
        user.auth2FALockedUntil = null;
        user.currentValidToken = null;
        user.pending2FAChallengeHash = null;
        user.pending2FAChallengeExpiresAt = null;
        await user.save();
        disconnectAccount(req.app?.get?.("io"), user._id);
        res.json({ message: "LOGOUT_OK", authResult: "AUTH_2FA_DISABLE_OK" });
    } catch (_) { res.json({ authResult: "AUTH_2FA_DISABLE_ERROR" }); }
};

exports.getStoriesByUsername = async (req, res) => {
    const Friendship = require("../models/friendships/friendships");
    try {
        const user = await User.findOne({ username: req.params.username }).populate("stories");
        if (!user) return res.status(404).json({ message: "GET_STORIES_BY_USERNAME_ERROR" });
        if (!user._id.equals(req.user._id)) {
            const friendship = await Friendship.findOne({ $or: [
                { user1: user._id, user2: req.user._id },
                { user1: req.user._id, user2: user._id }
            ] });
            if (!friendship) return res.status(403).json({ message: "STORY_NOT_ALLOWED" });
        }
        const activeStories = user.stories.filter(story =>
            new Date(story.expireDate).getTime() > Date.now());
        res.json({
            message: "GET_STORIES_BY_USERNAME_OK",
            userInfo: { username: user.username, profilePictureURL: user.profilePictureURL },
            stories: activeStories
        });
    } catch (_) { res.json({ message: "GET_STORIES_BY_USERNAME_ERROR" }); }
};
