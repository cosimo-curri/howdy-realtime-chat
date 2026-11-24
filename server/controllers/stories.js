const Story = require("../models/stories");

const moment = require("moment");

const path = require("path");
const fs = require("fs");

const helpers = require("../utils/helpers");
const scheduleJobs = require("../utils/scheduleJobs");

///////////////////////////////////////////////////////////////////
/// SCHEDULING STORIES ELIMINATION (ONLY WHEN IS REALLY NEEDED) ///
///////////////////////////////////////////////////////////////////

const schedule = require("node-schedule");

//STORIES ARE VALID FOR 24 HOURS
exports.manageStoryDate = (req, res, next) => {
    const date = moment();
    const expireDate = date.clone().add(24, "hours");

    req.date = date;
    req.expireDate = expireDate;

    next();
};

//username + Date.now() IS A UNIQUE VALUE FOR THE LOGGED USER
//IMAGE OR VIDEO EXTENSIONS ARE THE ONLY ALLOWED
exports.uploadStoryContent = async (req, res, next) => {
    const allowedExtImage = [".jpeg", ".jpg", ".png"];
    const allowedExtVideo = [".mp4", ".wmv", ".avi", ".mkv", ".webm"];

    const file = req.files?.file;
    if (!file) return res.json({ message: "UPLOAD_ERROR" });
    const ext = path.extname(file.name).toLowerCase();
    const made = await helpers.mkdir(path.join(__dirname, "..", "howdy_cloud_storage", "stories", helpers.safeFileStem(req.user.username)));
    if (made.message !== "CREATING_DIRECTORY_OK") return res.json({ message: "UPLOAD_ERROR" });

    const currentDate = Date.now();

    if((allowedExtImage.includes(ext) && helpers.isValidImageFile(file, ext)) || (allowedExtVideo.includes(ext) && helpers.isValidMediaFile(file, ext))) {
        let filename = "";
        let type = "";

        if(allowedExtImage.includes(ext)) {
            type = "IMAGE";
            filename = helpers.safeFileStem(req.user.username) + currentDate + ext;
        } else if(allowedExtVideo.includes(ext)) {
            type = "VIDEO";
            filename = helpers.safeFileStem(req.user.username) + currentDate + ext;
        }

        const resUpload = await helpers.fileUpload(path.join(__dirname, "..", "howdy_cloud_storage", "stories", helpers.safeFileStem(req.user.username), filename), file);
        
        if(resUpload.message === "UPLOAD_OK") {
            req.story = new Story({
                type: type,
                storagePath: `${helpers.safeFileStem(req.user.username)}/${filename}`,
                date: req.date.toDate(),
                expireDate: req.expireDate
            });
            req.story.contentURL = `${process.env.BASE_URL}/tokenApi/manageStories/storyContent/${req.story._id}`;

            next();
        } else
            res.json({ message: "UPLOAD_ERROR" });
    } else
        res.json({ message: "EXT_NOT_SUPPORTED" });
};

//req.body.backgroundColor IN HEX
exports.insertStoryMood = (req, res, next) => {
    if(req.body.backgroundColor && req.body.subtitle) {
        if(helpers.isHexColor(req.body.backgroundColor) && req.body.subtitle.length <= 50) {
            req.story = new Story({
                type: "MOOD",
                mood: {
                    backgroundColor: req.body.backgroundColor,
                    subtitle: req.body.subtitle
                },
                date: req.date.toDate(),
                expireDate: req.expireDate
            });

            next();
        } else
            res.json({ message: "INSERT_STORY_MOOD_ERROR" });
    } else
        res.json({ message: "INSERT_STORY_MOOD_ERROR" });
};

//REMOVING THE STORY FROM THE STORIES ARRAY OF A USER IS THE PRIORITY
exports.pushStory = async (req, res) => {
    try {
        await req.story.save();

        req.user.stories.push(req.story);
        await req.user.save();

        const expireDate = req.expireDate;

        //////////////////////
        /// SCHEDULING JOB ///
        //////////////////////

        schedule.scheduleJob(expireDate.toDate(), () => {
            scheduleJobs.deleteStory(req.user, req.story, expireDate);
        });

        res.json({
            message: "INSERT_STORY_OK",
            story: req.story
        });
    } catch(error) {
        res.json({ message: "INSERT_STORY_ERROR" });
    }
};

//PASSING ONLY THE USERNAME BECAUSE IS THE ONLY NEEDED FOR GET ALL THE STORIES
exports.getFriendsNewStories = (req, res) => {
    if(req.friends) {
        const friendsNewStories = req.friends.map((element) => {
            let unseenStories = 0;

            element.stories.forEach((story) => {
                if(!story.seenUsers.includes(req.user._id))
                    unseenStories++;
            });

            if(unseenStories > 0)
                return element.username;
        });

        const clientFilterFriendsNewStories = friendsNewStories.filter((story) => story !== undefined);

        res.json({
            message: "GET_FRIENDS_NEW_STORIES_OK",
            friendsNewStories: clientFilterFriendsNewStories
        });
    } else
        res.json({ message: "GET_FRIENDS_NEW_STORIES_ERROR" });
};
// Story media is served only to its owner and their current friends.
exports.getStoryContent = async (req, res) => {
    const User = require("../models/users");
    const Friendship = require("../models/friendships/friendships");
    try {
        const story = await Story.findById(req.params.storyId);
        if (!story || !story.storagePath || new Date(story.expireDate).getTime() <= Date.now()) {
            return res.status(404).json({ message: "STORY_NOT_FOUND" });
        }
        const owner = await User.findOne({ stories: story._id });
        if (!owner) return res.status(404).json({ message: "STORY_NOT_FOUND" });
        if (!owner._id.equals(req.user._id)) {
            const connection = await Friendship.findOne({ $or: [
                { user1: owner._id, user2: req.user._id },
                { user1: req.user._id, user2: owner._id }
            ] });
            if (!connection) return res.status(403).json({ message: "STORY_NOT_ALLOWED" });
        }
        const base = path.resolve(__dirname, "..", "howdy_cloud_storage", "stories");
        const full = path.resolve(base, story.storagePath);
        if (!full.startsWith(base + path.sep)) return res.status(403).json({ message: "STORY_NOT_ALLOWED" });
        res.sendFile(full, error => { if (error && !res.headersSent) res.status(404).end(); });
    } catch (_) { res.status(404).json({ message: "STORY_NOT_FOUND" }); }
};
