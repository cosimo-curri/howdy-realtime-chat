const Message = require("../../models/chats/messages");

//FOR MONGOOSE TRANSACTIONS
const Chat = require("../../models/chats/chats");

const mongoose = require("mongoose");

const helpers = require("../../utils/helpers");
const path = require("path");
const crypto = require("node:crypto");

const moment = require("moment");

//username + Date.now() IS A UNIQUE VALUE FOR THE LOGGED USER
exports.uploadBinaryFile = async (req, res, next) => {
    const allowedExt = req.body.allowedExt;

    const file = req.files?.file;
    if (!file) return res.json({ message: "UPLOAD_ERROR" });
    const allowed = await helpers.isChatAllowed(req.params.chatId, req.user._id);
    if (allowed.message !== "YES") return res.status(403).json({ message: "CHAT_NOT_ALLOWED" });
    const ext = path.extname(file.name).toLowerCase();

    if(helpers.isExtAllowed(ext, allowedExt) &&
        helpers.isValidMediaFile(file, ext)) {
        const made = await helpers.mkdir(path.join(__dirname, "..", "..", "howdy_cloud_storage", "chats", req.params.chatId));
        if (made.message !== "CREATING_DIRECTORY_OK") return res.json({ message: "UPLOAD_ERROR" });

        const currentDate = Date.now();

        const filename = helpers.safeFileStem(req.user.username) + currentDate + crypto.randomBytes(6).toString("hex") + ext;
        const resUpload = await helpers.fileUpload(path.join(__dirname, "..", "..", "howdy_cloud_storage", "chats", req.params.chatId, filename), file);

        if(resUpload.message === "UPLOAD_OK") {
            req.body.chatId = req.params.chatId;
            req.body.message = `${process.env.BASE_URL}/tokenApi/manageChats/getChatBinaryFile/${filename}/${req.params.chatId}`;
            next();
        } else
            res.json({ message: "UPLOAD_ERROR" });
    } else
        res.json({ message: "EXT_NOT_SUPPORTED" });
};

//MONGOOSE TRANSACTION
//NO CLIENT FILTERING BECAUSE THE CLIENT NEEDS TO KNOW THE IV (WITHOUT THE KEY IS USELESS)
exports.insertMessage = async (req, res) => {
    if(req.body.chatId && req.body.message) {
        const resChatAllowed = await helpers.isChatAllowed(req.body.chatId, req.user._id);
        
        if(resChatAllowed.message === "YES") {
            let messageType = "";

            if(req.body.type)
                messageType = req.body.type;
            else
                messageType = "TEXT";

            const session = await mongoose.connection.startSession();
            session.startTransaction();
            
            try {
                const currentDate = moment();

                const message = new Message({
                    senderUser: req.user._id,
                    message: req.body.message,
                    type: messageType,
                    date: currentDate.toDate()
                });

                await message.save({ session });

                const chat = await Chat.findById(req.body.chatId);

                chat.messages.push(message._id);
                await chat.save({ session });

                await session.commitTransaction();
                
                const dataJSON = {
                    message: "INSERT_MESSAGE_OK",
                    messageDB: message,
                    chatId: chat._id,
                    senderUsername: req.user.username
                };
                
                res.json(dataJSON);
            } catch(error) {
                await session.abortTransaction();
                res.json({ message: "INSERT_MESSAGE_ERROR" });
            } finally {
                await session.endSession();
            }
        } else if(resChatAllowed.message === "NO")
            res.json({ message: "CHAT_NOT_ALLOWED" });
        else
            res.json({ message: "INSERT_MESSAGE_ERROR" });
    } else
        res.json({ message: "INSERT_MESSAGE_ERROR" });
};

//req.params.chatId AND req.params.filename EXISTENCE CHECK NEEDED IN THIS CASE
exports.getChatBinaryFile = async (req, res) => {
    if(req.params.chatId && req.params.filename) {
        const resChatAllowed = await helpers.isChatAllowed(req.params.chatId, req.user._id);
        
        if(resChatAllowed.message === "YES" &&
            /^[a-zA-Z0-9_-]+\.(png|jpe?g|webp|mp3|webm|ogg|m4a|wav|mp4|wmv|avi|mkv)$/.test(req.params.filename)) {
            res.sendFile(path.join(__dirname, "..", "..", "howdy_cloud_storage", "chats", req.params.chatId, req.params.filename));
        } else if(resChatAllowed.message === "NO")
            res.json({ message: "CHAT_NOT_ALLOWED" });
        else
            res.json({ message: "GET_CHAT_BINARY_FILE_ERROR" });
    } else
        res.json({ message: "GET_CHAT_BINARY_FILE_ERROR" });
};