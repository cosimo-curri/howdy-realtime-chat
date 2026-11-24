const User = require("../models/users");
const Chat = require("../models/chats/chats");

//IN THIS FILE BEACAUSE IS NOT A MIDDLEWARE
exports.getUserByUserId = async (userId) => {
    try {
        const user = await User.findOne({ _id: userId });

        if(user) {
            return user;
        } else {
            return "USER_NOT_FOUND";
        }
    } catch(error) {
        return "GET_USER_BY_USER_ID_ERROR";
    }
};

exports.getOtherPartecipantsChatsByUserId = async (userId) => {
    try {
        const chats = await Chat.find({
            partecipants: {
                $in: [userId]
            }
        })
        .select("partecipants");

        if(chats.length !== 0) {
            const otherPartecipantsIds = chats.map(chat => {
                if(chat.partecipants[0].equals(userId))
                    return chat.partecipants[1];
                else
                    return chat.partecipants[0];
            });

            return otherPartecipantsIds;
        } else {
            return "CHATS_NOT_FOUND";
        }
    } catch(error) {
        return "GET_CHATS_BY_USER_ID_ERROR"
    }
};