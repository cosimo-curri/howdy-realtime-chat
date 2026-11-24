const { registerConnection, unregisterConnection, connectionIds } = require("../utils/socketConnections");
const socketHelpers = require("../utils/socketHelpers");
const PendingRequest = require("../models/friendships/pendingRequests");
const User = require("../models/users");

const moment = require("moment");

const handler = async (socket) => {
    const userId = socket.decoded_token.data;
    const user = await socketHelpers.getUserByUserId(userId);
    
    if (typeof user === "string") return socket.disconnect(true);
    registerConnection(global.userSocketOnlineUsers, userId, socket.id);
    console.log(`SERVER (USER SOCKET): new connection mapping\n\t• USER ID: ${userId}\n\t• SOCKET ID: ${socket.id}`);
    
            if(typeof user !== "string") {
        socket.on("newFriendOffline", async () => {
            if (connectionIds(global.userSocketOnlineUsers, userId).length > 1) return;
            const otherPartecipantsIds = await socketHelpers.getOtherPartecipantsChatsByUserId(userId);
            
            if(typeof otherPartecipantsIds !== "string") {
                const otherOnlinePartecipantsSocketIds = otherPartecipantsIds.map((element) => {
                    const id = element.toString();

                    if(connectionIds(global.userSocketOnlineUsers, id).length)
                        return connectionIds(global.userSocketOnlineUsers, id);
                }).filter(Boolean).flat();
                
                const currentDate = moment();
                const pastDate = currentDate.subtract(3, "minutes");

                user.lastAccess = pastDate.toDate();
                user.save();

                socket.to(otherOnlinePartecipantsSocketIds).emit("receiveNewFriendOffline", {
                    userId: userId,
                    lastAccess: user.lastAccess
                });
            }
        });
        
        socket.on("sendFriendRequest", async (data) => {
            if (!data || !data._id || !data.recipientUserSocket) return;
            try {
                const request = await PendingRequest.findOne({ _id: data._id,
                    senderUser: userId, recipientUser: data.recipientUserSocket });
                if (!request) return;
                const recipientSocket = connectionIds(global.userSocketOnlineUsers, data.recipientUserSocket);
                if (!recipientSocket.length) return;
                const recipient = await User.findById(data.recipientUserSocket);
                if (!recipient) return;
                socket.to(recipientSocket).emit("receiveFriendRequest", {
                    _id: request._id,
                    date: request.date,
                    recipientUser: { _id: recipient._id, username: recipient.username,
                        profilePictureURL: recipient.profilePictureURL },
                    senderUser: { _id: user._id, username: user.username,
                        profilePictureURL: user.profilePictureURL }
                });
            } catch (_) { /* Ignore forged or obsolete request IDs. */ }
        });

        // Friendship deletion and request withdrawal notifications are emitted by the
        // authenticated REST actions, not by untrusted client-supplied recipient IDs.

        socket.on("notifyUsernameChange", async (data) => {
            const otherPartecipantsIds = await socketHelpers.getOtherPartecipantsChatsByUserId(userId);
            
            if(typeof otherPartecipantsIds !== "string") {
                const otherOnlinePartecipantsSocketIds = otherPartecipantsIds.map((element) => {
                    const id = element.toString();

                    if(connectionIds(global.userSocketOnlineUsers, id).length)
                        return connectionIds(global.userSocketOnlineUsers, id);
                }).filter(Boolean).flat();

                const currentUser = await User.findById(userId);
                if (!currentUser) return;
                socket.to(otherOnlinePartecipantsSocketIds).emit("receiveNotifyUsernameChange", {
                    userId: userId,
                    newUsername: currentUser.username
                });
            }
        });
        
        socket.on("notifyProfilePictureChange", async (data) => {
            const otherPartecipantsIds = await socketHelpers.getOtherPartecipantsChatsByUserId(userId);
            
            if(typeof otherPartecipantsIds !== "string") {
                const otherOnlinePartecipantsSocketIds = otherPartecipantsIds.map((element) => {
                    const id = element.toString();

                    if(connectionIds(global.userSocketOnlineUsers, id).length)
                        return connectionIds(global.userSocketOnlineUsers, id);
                }).filter(Boolean).flat();

                const currentUser = await User.findById(userId);
                if (!currentUser) return;
                socket.to(otherOnlinePartecipantsSocketIds).emit("receiveNotifyProfilePictureChange", {
                    userId: userId,
                    newProfilePictureURL: currentUser.profilePictureURL
                });
            }
        });
    }

    socket.on("disconnect", () => {
        console.log(`SERVER (USER SOCKET): io user ${socket.id} disconnected`);
        unregisterConnection(global.userSocketOnlineUsers, userId, socket.id);
    });
};

module.exports = { handler };