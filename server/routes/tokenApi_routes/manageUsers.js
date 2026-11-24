const express = require("express");
const router = express.Router();

const usersController = require("../../controllers/users");
const pendingRequestsController = require("../../controllers/friendships/pendingRequests");
const friendshipsController = require("../../controllers/friendships/friendships");

//GET CONVENTIONAL METHOD FOR QUERYING DATA (USING PARAMS)
//username IS UNIQUE
router.get("/getUserByUsername/:username", usersController.getUserByUsername);
router.get("/getUserById/:userId", usersController.getUserById);

//GET CONVENTIONAL METHOD FOR QUERYING DATA (USING PARAMS)
router.get("/findUser/:value", usersController.findUser);

//FRIENDSHIPS
router.post("/sendFriendRequest", pendingRequestsController.sendFriendRequest);
router.post("/manageFriendRequest", pendingRequestsController.manageFriendRequest);
router.delete("/deletePendingRequest", pendingRequestsController.deletePendingRequest);
router.get("/getPendingFriendRequests", pendingRequestsController.getPendingFriendRequests);
router.delete("/deleteFriend", friendshipsController.deleteFriend);

module.exports = router;