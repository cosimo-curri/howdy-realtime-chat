const Story = require("../models/stories");
const fs = require("fs");
const path = require("path");

exports.deleteStory = async (user, story, expireDate) => {
    try {
        if (!user) return;
        user.stories.pull(story);
        await user.save();
        await Story.deleteOne({ _id: story._id });
        if (story.storagePath) {
            const base = path.resolve(__dirname, "..", "howdy_cloud_storage", "stories");
            const file = path.resolve(base, story.storagePath);
            if (file.startsWith(base + path.sep)) await fs.promises.unlink(file).catch(() => {});
        }
        console.log(`SERVER (STORIES MANAGEMENT): ${user.username}'s story expired at ${expireDate.toDate()}`);
    } catch (_) { console.log("SERVER (STORIES MANAGEMENT): expiry cleanup failed"); }
};
