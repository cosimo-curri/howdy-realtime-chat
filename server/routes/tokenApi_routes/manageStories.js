const express = require("express");
const router = express.Router();

const storiesController = require("../../controllers/stories");
const usersController = require("../../controllers/users");
const friendshipsController = require("../../controllers/friendships/friendships");

//////////////////////////////////////////////////////////////////////////////////////////////////////
/// SEE THE ROUTE /tokenApi/file/uploadStoryContent (NOT HERE BECAUSE NEEDS A SPECIFIC MIDDLEWARE) ///
//////////////////////////////////////////////////////////////////////////////////////////////////////

//A MOOD STORY IS A STORY IN WHICH USERS CAN EXPLAIN THEIR CURRENT MOOD IN SHORT SENTENCES (MAX 50 CHARACTERS)
router.post("/insertStoryMood", storiesController.manageStoryDate, storiesController.insertStoryMood, storiesController.pushStory);

router.get("/getStoriesByUsername/:username", usersController.getStoriesByUsername);

router.get("/storyContent/:storyId", storiesController.getStoryContent);
router.get("/getFriendsNewStories", friendshipsController.getUserFriendsList, storiesController.getFriendsNewStories);

module.exports = router;