const express = require("express");
const router = express.Router();

const chatsController = require("../../controllers/chats/chats");
const messagesController = require("../../controllers/chats/messages");

router.post("/createChat", chatsController.createChat);
router.get("/getAllChats", chatsController.getAllChats);
router.post("/insertMessage", messagesController.insertMessage);
router.get("/getAllChatMessages/:chatId", chatsController.getAllChatMessages);

router.get("/getChatBinaryFile/:filename/:chatId", messagesController.getChatBinaryFile)

module.exports = router;