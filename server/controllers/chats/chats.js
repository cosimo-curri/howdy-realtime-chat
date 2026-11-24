const Chat = require("../../models/chats/chats");

const helpers = require("../../utils/helpers");

exports.createChat = async (req, res) => {
    if(req.body.userId1 && req.body.userId2) {
        const userId1 = req.body.userId1;
        const userId2 = req.body.userId2;
        
        if(userId1 === userId2 ||
            (String(req.user._id) !== String(userId1) && String(req.user._id) !== String(userId2)))
            res.json({ message: "CREATE_CHAT_ERROR" });
        else {
            try {
                const chat = await Chat.findOne({
                    partecipants: {
                        $all: [userId1, userId2]
                    }
                });

                if(chat) {
                    res.json({
                        message: "CHAT_ALREADY_EXIST",
                        chatId: chat._id
                    });
                } else {
                    const result = await helpers.isAlreadyFriendOrRequest(userId1, userId2);

                    if(result.message === "ALREADY_FRIEND") {
                        Chat.create({
                            partecipants: [userId1, userId2]
                        })
                        .then(chat => {
                            res.json({
                                message: "CREATE_CHAT_OK",
                                chatId: chat._id
                            });
                        })
                        .catch(() => res.json({ message: "CREATE_CHAT_ERROR" }));
                    } else
                        res.json({ message: "CREATE_CHAT_ERROR" });
                }
            } catch(error) {
                res.json({ message: "CREATE_CHAT_ERROR" });
            }
        }
    } else
        res.json({ message: "CREATE_CHAT_ERROR" });
};

//MONGOOSE limit OPTION IS NOT WORKING IN THIS CASE WITH moment'S DATE
exports.getAllChats = (req, res) => {
    Chat.find({
        partecipants: {
            $in: [req.user._id]
        }
    })
    .populate({
        path: "partecipants",
        select: "username profilePictureURL lastAccess"
    })
    .populate({
        path: "messages",
        options: { sort: { date: -1 } },
        populate: {
            path: "senderUser",
            select: "username"
        }
    })
    .then(chats => {
        const clientFilterChats = helpers.clientFilterChats(chats, req.user._id, "ONLY_ONE");

        clientFilterChats.sort((a, b) => {
            if (a.messages[0] && b.messages[0])
                return b.messages[0].date - a.messages[0].date;
            else if (a.messages[0] && !b.messages[0])
                return -1;
            else if (!a.messages[0] && b.messages[0])
                return 1;
            else
                return 0;
        });

        const dataJSON = {
            message: "GET_ALL_CHATS_OK",
            chats: clientFilterChats
        };

        res.json(dataJSON);
    })
    .catch(() => res.json({ message: "GET_ALL_CHATS_ERROR" }));
};

exports.getAllChatMessages = (req, res) => {
    Chat.findOne({
        _id: req.params.chatId,
        partecipants: {
            $in: [req.user._id]
        }
    })
    .populate({
        path: "partecipants",
        select: "_id username profilePictureURL lastAccess"
    })
    .populate({
        path: "messages",
        populate: {
            path: "senderUser",
            select: "username"
        }
    })
    .then(chat => {
        if (!chat) return res.json({ message: "CHAT_NOT_ALLOWED" });
        const clientFilterChats = helpers.clientFilterChats([chat], req.user._id, "ALL");
        
        const dataJSON = {
            message: "GET_ALL_CHAT_MESSAGES_OK",
            chats: clientFilterChats
        };

        res.json(dataJSON);
    })
    .catch(() => res.json({ message: "GET_ALL_CHAT_MESSAGES_ERROR" }));
};