const { registerConnection, unregisterConnection, connectionIds } = require("../utils/socketConnections");
const socketHelpers = require("../utils/socketHelpers");
const Chat = require("../models/chats/chats");
const Message = require("../models/chats/messages");

const moment = require("moment");

const handler = async (socket) => {
    const userId = socket.decoded_token.data;
    const user = await socketHelpers.getUserByUserId(userId);
    
    if (typeof user === "string") return socket.disconnect(true);
    registerConnection(global.chatSocketOnlineUsers, userId, socket.id);
    console.log(`SERVER (CHAT SOCKET): new connection mapping\n\t• USER ID: ${userId}\n\t• SOCKET ID: ${socket.id}`);
    
        if(typeof user !== "string") {
        socket.on("sendMessage", async (data) => {
            if (!data || !data.recipientUser || !data.chatId || !data._id) return;
            try {
                const chat = await Chat.findOne({
                    _id: data.chatId, partecipants: { $all: [userId, data.recipientUser] }
                });
                const message = chat && await Message.findOne({ _id: data._id, senderUser: userId });
                if (!message || !chat.messages.some(id => String(id) === String(message._id))) return;
                const recipientSocket = connectionIds(global.chatSocketOnlineUsers, data.recipientUser);
                if (recipientSocket.length) {
                    socket.to(recipientSocket).emit("receiveMessage", {
                        senderUser: user._id,
                        message: message.message,
                        date: message.date,
                        type: message.type,
                        _id: message._id,
                        chatId: chat._id,
                        senderUsername: user.username
                    });
                }
            } catch (_) { /* Invalid chat/message identifiers are rejected. */ }
        });
    
        //data.isWriting BOOLEAN
                socket.on("notifyUserStatus", async (data) => {
            if (data && data.recipientUser && data.chatId) {
                const otherPartecipantsIds = await socketHelpers.getOtherPartecipantsChatsByUserId(userId);
                if (typeof otherPartecipantsIds === "string" ||
                    !otherPartecipantsIds.some(id => String(id) === String(data.recipientUser))) return;
                const ownedChat = await Chat.findOne({ _id: data.chatId,
                    partecipants: { $all: [userId, data.recipientUser] } });
                if (!ownedChat) return;
                const recipientUserSocket = connectionIds(global.chatSocketOnlineUsers, data.recipientUser);
                
                if(typeof otherPartecipantsIds !== "string") {
                    const otherOnlinePartecipantsSocketIds = otherPartecipantsIds.map((element) => {
                        const id = element.toString();

                        if(connectionIds(global.chatSocketOnlineUsers, id).length)
                            return connectionIds(global.chatSocketOnlineUsers, id);
                    }).filter(Boolean).flat();

                    const currentDate = moment();
                    const userLastAccess = moment(user.lastAccess);
                    
                    const diffMinutes = currentDate.diff(userLastAccess, "minutes");

                    if(diffMinutes > 3) {
                        user.lastAccess = currentDate.toDate();
                        user.save();
                    }
                    
                    socket.to(otherOnlinePartecipantsSocketIds).emit("receiveNewFriendOnline", {
                        userId: userId,
                        lastAccess: user.lastAccess
                    });
                }

                if(recipientUserSocket.length) {
                    const dataJSON = {
                        isWriting: data.isWriting,
                        chatId: data.chatId
                    }
    
                    if(!data.isWriting)
                        dataJSON.lastAccess = user.lastAccess;
                    
                    socket.to(recipientUserSocket).emit("receiveNotifyUserStatus", dataJSON);
                }
            }
        });

        socket.on("createChat", async (data) => {
            if (!data || !data.recipientUser || !data.newChat?._id) return;
            try {
                const chat = await Chat.findOne({ _id: data.newChat._id,
                    partecipants: { $all: [userId, data.recipientUser] } });
                if (!chat) return;
                const recipientUserSocket = connectionIds(global.chatSocketOnlineUsers, data.recipientUser);
                // The receiving UI expects the other participant's public profile.
                // Build it from the authenticated user rather than trusting client data.
                if (recipientUserSocket.length) socket.to(recipientUserSocket).emit("receiveNewChat", {
                    _id: chat._id,
                    messages: [],
                    partecipants: [{
                        _id: user._id,
                        username: user.username,
                        profilePictureURL: user.profilePictureURL,
                        lastAccess: user.lastAccess
                    }]
                });
            } catch (_) { /* Ignore invalid chat references. */ }
        });
    }
    
    socket.on("disconnect", () => {
        console.log(`SERVER (CHAT SOCKET): io user ${socket.id} disconnected`);
        unregisterConnection(global.chatSocketOnlineUsers, userId, socket.id);
    });
};

module.exports = { handler };