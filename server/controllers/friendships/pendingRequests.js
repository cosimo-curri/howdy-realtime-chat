const { connectionIds } = require("../../utils/socketConnections");
const PendingRequest = require("../../models/friendships/pendingRequests");
const Friendship = require("../../models/friendships/friendships");
const mongoose = require("mongoose");

const helpers = require("../../utils/helpers");

const moment = require("moment");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//EXPORTS MIDDLEWARE CHAIN
//req.body.userId IS THE ID OF THE RECIPIENT USER
exports.sendFriendRequest = async (req, res) => {
    if(req.body.userId) {
        const isAlreadyFriendOrRequest = await helpers.isAlreadyFriendOrRequest(req.user._id, req.body.userId);

        if(req.user._id.equals(req.body.userId))
            res.json({ message: "SEND_FRIEND_REQUEST_ERROR" });
        else if(isAlreadyFriendOrRequest.message === "FALSE") {
            const currentDate = moment();

            PendingRequest.create({
                senderUser: req.user._id,
                recipientUser: req.body.userId,
                date: currentDate.toDate()
            })
            .then((pr) => res.json({ message: "SEND_FRIEND_REQUEST_OK", pendingRequest: pr }))
            .catch(() => res.json({ message: "SEND_FRIEND_REQUEST_ERROR" }));
        } else if(isAlreadyFriendOrRequest.message === "ALREADY_FRIEND" || isAlreadyFriendOrRequest.message === "ALREADY_REQUEST")
            res.json({ message: isAlreadyFriendOrRequest.message });
        else
            res.json({ message: "SEND_FRIEND_REQUEST_ERROR" });
    } else
        res.json({ message: "SEND_FRIEND_REQUEST_ERROR" });
};

exports.getPendingFriendRequests = (req, res) => {
    PendingRequest.find({ recipientUser: req.user._id })
    .populate({
        path: "recipientUser",
        select: "_id username profilePictureURL"
    })
    .populate({
        path: "senderUser",
        select: "_id username profilePictureURL"
    })
    .then(prs => res.json(prs))
    .catch(() => res.json({ message: "FIND_PENDING_REQUESTS_QUERY_ERROR" }));
};

exports.manageFriendRequest = async (req, res) => {
    const { pendingRequestId, action } = req.body;
    if (!pendingRequestId || (action !== "REJECT" && action !== "ACCEPT")) {
        return res.json({ message: "MANAGE_FRIEND_REQUEST_ERROR" });
    }

    const query = { _id: pendingRequestId, recipientUser: req.user._id };
    if (action === "REJECT") {
        try {
            const request = await PendingRequest.findOneAndDelete(query);
            return res.json({ message: request ? "REJECT_OK" : "MANAGE_FRIEND_REQUEST_ERROR" });
        } catch (_) {
            return res.json({ message: "MANAGE_FRIEND_REQUEST_ERROR" });
        }
    }

    // Both changes must commit together: a failed friendship creation must not
    // consume the pending request. MongoDB transactions require a replica set.
    let session;
    try {
        session = await mongoose.connection.startSession();
        const accepted = await session.withTransaction(async () => {
            const request = await PendingRequest.findOneAndDelete(query, { session });
            if (!request) return false;

            await Friendship.create([{
                user1: request.senderUser,
                user2: request.recipientUser,
                acceptDate: moment().toDate()
            }], { session });
            return true;
        });
        return res.json({ message: accepted ? "ACCEPT_OK" : "MANAGE_FRIEND_REQUEST_ERROR" });
    } catch (_) {
        return res.json({ message: "MANAGE_FRIEND_REQUEST_ERROR" });
    } finally {
        if (session) await session.endSession();
    }
};

//ID OF THE PENDING FRIEND REQUEST ONLY IF THE SENDER IS THE LOGGED USER (SEE helpers.isAlreadyFriendOrRequest())
//ONLY WITH THIS ID A PENDING FRIEND REQUEST CAN BE DELETED
exports.deletePendingRequest = (req, res) => {
    if(req.body.pendingRequestId) {
        PendingRequest.findOneAndDelete({ _id: req.body.pendingRequestId, senderUser: req.user._id }) //AND
            .then((pr) => {
                if (!pr) return res.json({ message: "PENDING_REQUEST_DELETE_ERROR" });
                const recipientSocket = connectionIds(global.userSocketOnlineUsers, pr.recipientUser);
                if (recipientSocket.length) {
                    req.app.get("io").of("/socket/user").to(recipientSocket).emit("receiveWithdrawn", {
                        pendingRequestId: String(pr._id)
                    });
                }
                res.json({ message: "PENDING_REQUEST_DELETE_OK" });
            })
            .catch(() => res.json({ message: "PENDING_REQUEST_DELETE_ERROR" }));
    } else
        res.json({ message: "PENDING_REQUEST_DELETE_ERROR" });
};