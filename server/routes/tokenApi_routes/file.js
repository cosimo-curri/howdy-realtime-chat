const crypto = require("node:crypto");
const express = require("express");
const router = express.Router();

const expressFileUpload = require("express-fileupload");

const messagesController = require("../../controllers/chats/messages");
const storiesController = require("../../controllers/stories");

const helpers = require("../../utils/helpers");

const path = require("node:path");
const fs = require("node:fs/promises");

router.use(expressFileUpload({ limits: { fileSize: 25 * 1024 * 1024 }, abortOnLimit: true }));

//////////////////////////////////////////////////////////////////////////////////////////////////
/// ROUTE ONLY FOR UPLOADING FILE IN THE WEB SERVER AND FOR MANAGING THE EFFECTS ON THE SYSTEM ///
//////////////////////////////////////////////////////////////////////////////////////////////////

// Reject missing or multiple files, unexpected request names and empty files.
router.use((req, res, next) => {
    if (!req.files || !req.files.file || Object.keys(req.files).length !== 1 ||
        Array.isArray(req.files.file) || !req.files.file.size) {
        return res.status(400).json({ message: "UPLOAD_ERROR" });
    }
    next();
});

// Preserve the image format and use an unguessable filename for each upload.
router.post("/uploadProfilePicture", async (req, res) => {
    const allowedExt = [".jpeg", ".jpg", ".png", ".webp"];

    const file = req.files.file;
    const ext = path.extname(file.name).toLowerCase();

    if(helpers.isExtAllowed(ext, allowedExt) && helpers.isValidImageFile(file, ext)) {
        const filename = `${helpers.safeFileStem(req.user.username)}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        const resUpload = await helpers.fileUpload(path.join(__dirname, "..", "..", "howdy_cloud_storage", "profile_pictures", filename), file);

        if(resUpload.message === "UPLOAD_OK") {
            const oldUrl = req.user.profilePictureURL;
            const oldFilename = helpers.managedProfilePictureFilename(oldUrl, process.env.BASE_URL);
            req.user.profilePictureURL = `${process.env.BASE_URL}/profilePictures/${filename}`;
            try {
                await req.user.save();
            } catch (_) {
                req.user.profilePictureURL = oldUrl;
                await fs.unlink(path.join(__dirname, "..", "..", "howdy_cloud_storage", "profile_pictures", filename)).catch(() => {});
                return res.json({ message: "UPLOAD_ERROR" });
            }

            // Remove replaced local images, never external or default avatars.
            if (oldFilename && oldFilename !== filename) {
                await fs.unlink(path.join(__dirname, "..", "..", "howdy_cloud_storage", "profile_pictures", oldFilename))
                    .catch(error => { if (error.code !== "ENOENT") console.warn("Could not remove replaced picture:", error.message); });
            }

            res.json({
                message: resUpload.message,
                userInfo: helpers.clientFilterUser(req.user)
            });
        } else
            res.json({ message: "UPLOAD_ERROR" });
    } else
        res.json({ message: "EXT_NOT_SUPPORTED" });
});

////////////////////
/// MANAGE CHATS ///
////////////////////

router.post("/uploadChatPicture/:chatId", (req, res, next) => {
    req.body.allowedExt = [".jpeg", ".jpg", ".png"];
    req.body.type = "IMAGE";
    next();
}, messagesController.uploadBinaryFile, messagesController.insertMessage);

router.post("/uploadChatAudio/:chatId", (req, res, next) => {
    req.body.allowedExt = [".mp3", ".webm", ".ogg", ".m4a", ".wav"];
    req.body.type = "AUDIO";
    next();
}, messagesController.uploadBinaryFile, messagesController.insertMessage);

router.post("/uploadChatVideo/:chatId", (req, res, next) => {
    req.body.allowedExt = [".mp4", ".wmv", ".avi", ".mkv", ".webm"];
    req.body.type = "VIDEO";
    next();
}, messagesController.uploadBinaryFile, messagesController.insertMessage);

//////////////////////
/// MANAGE STORIES ///
//////////////////////

router.post("/uploadStoryContent", storiesController.manageStoryDate, storiesController.uploadStoryContent, storiesController.pushStory);

module.exports = router;