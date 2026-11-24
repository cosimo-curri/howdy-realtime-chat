const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

//THE PASSWORD FIELD IS NOT REQUIRED DUE TO ITS AUTOMATIC MANAGEMENT BY passport-local-mongoose
//TYPE STRING ALSO FOR AN ENUM OF ONLY ONE CHAR
const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    lastAccess: Date,
    profilePictureURL: String,
    gender: {
        type: String,
        enum: ["M", "F"]
    },
    birthday: Date,
    contacts: {
        instagram: String,
        facebook: String,
        linkedin: String
    },
    stories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story"
    }],
    signupMethod: {
        local: {
            type: Boolean,
            default: false
        },
        google: {
            type: Boolean,
            default: false
        }
    },
    currentValidToken: String,
    pending2FAChallengeHash: String,
    pending2FAChallengeExpiresAt: Date,
    androidDeviceTokenHash: String,
    androidEnrollmentCodeHash: String,
    androidEnrollmentCodeExpiresAt: Date,
    secureSignUp: {
        active: {
            type: Boolean,
            default: false
        },
        activationToken: String
    },
    changePasswordToken: String,
    darkTheme: {
        type: Boolean,
        default: false
    },
    auth2FA: {
        type: Boolean,
        default: false
    },
    failed2FAAttempts: { type: Number, default: 0 },
    auth2FALockedUntil: Date,
    failedEnrollmentAttempts: { type: Number, default: 0 },
    enrollmentLockedUntil: Date,
    code2FA: {
        value: String,
        date: Date
    }
});

userSchema.plugin(passportLocalMongoose, {
    usernameField: "username"
});

module.exports = mongoose.model("User", userSchema);