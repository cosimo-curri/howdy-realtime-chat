const express = require("express");
const router = express.Router();

const usersController = require("../../controllers/users");
const helpers = require("../../utils/helpers");
const validators = require("../../utils/validators");

const fs = require("node:fs/promises");
const path = require("node:path");

router.delete("/deleteProfilePicture", async (req, res) => {
    const previousUrl = req.user.profilePictureURL;
    const filename = helpers.managedProfilePictureFilename(previousUrl, process.env.BASE_URL);

    helpers.applyDefaultProfilePicture(req);
    try {
        await req.user.save();
    } catch (_) {
        req.user.profilePictureURL = previousUrl;
        return res.json({ message: "DELETE_PROFILE_PICTURE_ERROR" });
    }

    // A Google-hosted photo or a default avatar has no local file to delete.
    if (filename) {
        try {
            await fs.unlink(path.join(__dirname, "..", "..", "howdy_cloud_storage", "profile_pictures", filename));
        } catch (error) {
            // The saved profile already points to a default avatar. Avoid failing
            // the user operation because of an absent or inaccessible old file.
            if (error.code !== "ENOENT") console.warn("Could not delete old profile picture:", error.message);
        }
    }

    return res.json({ message: "DELETE_PROFILE_PICTURE_OK", userInfo: helpers.clientFilterUser(req.user) });
});

router.put("/changeUserInfo", usersController.changeUserInfo);

// Only for locally authenticated accounts.
router.put("/changePassword",
    usersController.onlyLocalAuth,
    usersController.changePassword.firstStep,
    validators.strongPasswordValidator,
    usersController.changePassword.stepAfterPasswordValidation,
    usersController.logout);

router.put("/changeDarkTheme", usersController.changeDarkTheme);
router.get("/loggedUserAuth2FA", usersController.loggedUserAuth2FA);

module.exports = router;
