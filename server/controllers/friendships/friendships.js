const { connectionIds } = require("../../utils/socketConnections");
const Friendship = require("../../models/friendships/friendships");

//FOR SPECIFIC MIDDLEWARES
const Chat = require("../../models/chats/chats");
const Message = require("../../models/chats/messages");

const mongoose = require("mongoose");

const fs = require("fs");
const path = require("path");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//MONGOOSE TRANSACTION
//DON'T CHECK IF THE USER ID IS EQUALS TO THE LOGGED USER ID BECAUSE THERE ARE CONTROLS DURING THE SEND REQUEST PHASE
//BIDIRECTIONAL OPERATION: THE SENDER OR THE RECIPIENT OF THE FRIEND REQUEST CAN DELETE A FRIENDSHIP
//DELETING ALSO THE CHAT, THE MESSAGES AND THE FILES
exports.deleteFriend = async (req, res) => {
    if(req.body.userId) {
        const session = await mongoose.connection.startSession();
        session.startTransaction();
        let chatDirToDelete = null;

        try {
            const f = await Friendship.findOneAndDelete({
                $or: [
                    {
                        user1: req.body.userId,
                        user2: req.user._id
                    },
                    {
                        user1: req.user._id,
                        user2: req.body.userId
                    }
                ]
            }, { session }).session(session);

            if(f) {
                const chat = await Chat.findOneAndDelete({
                    partecipants: {
                        $all: [req.user._id, req.body.userId]
                    }
                }, { session }).session(session);

                if(chat) {
                    const messageIds = chat.messages;

                    await Message.deleteMany({
                        _id: {
                            $in: messageIds
                        }
                    }, { session }).session(session);

                    chatDirToDelete = path.join(__dirname, "..", "..", "howdy_cloud_storage", "chats", chat._id.toString());
                }

                await session.commitTransaction();
                if (chatDirToDelete) {
                    fs.promises.rm(chatDirToDelete, { recursive: true, force: true }).catch(() => {});
                }
                // Emit only after an authorized, committed deletion (never on client assertion).
                const recipientSocket = connectionIds(global.userSocketOnlineUsers, req.body.userId);
                if (recipientSocket.length) {
                    req.app.get("io").of("/socket/user").to(recipientSocket).emit("receiveNotifyDeleteFriend", {
                        userId: String(req.user._id)
                    });
                }
                res.json({ message: "FRIENDSHIP_DELETE_OK" });
            } else {
                await session.abortTransaction();
                res.json({ message: "FRIENDSHIP_DELETE_ERROR" });
            }
        } catch(error) {
            await session.abortTransaction();
            console.log(error);
            res.json({ message: "FRIENDSHIP_DELETE_ERROR" });
        } finally {
            await session.endSession();
        }
    } else
        res.json({ message: "FRIENDSHIP_DELETE_ERROR" });
};

//MIDDLEWARE FOR STORIES MANAGEMENT
exports.getUserFriendsList = (req, res, next) => {
    Friendship.find({
        $or: [
            { user1: req.user._id },
            { user2: req.user._id }
        ]
    })
    .populate({
        path: "user1",
        populate: {
            path: "stories",
            model: "Story"
        }
    })
    .populate({
        path: "user2",
        populate: {
            path: "stories",
            model: "Story"
        }
    })
    .then(friendships => {
        const friends = friendships.map((element) => {
            if(element.user1._id.equals(req.user._id))
                return element.user2;
            else
                return element.user1;
        });

        req.friends = friends;
        next();
    })
    .catch(() => res.json({ message: "GET_USER_FRIENDS_LIST_ERROR" }))
};