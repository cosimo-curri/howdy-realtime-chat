const mongoose = require("mongoose");

//CREATING A COLLECTION FOR THE CHATS TO INCREASE THE SCALABILITY AND CONSEQUENTLY THE SPEED OF THE QUERIES
//USING _id OF THE CHATS
//partecipants IS USEFUL FOR QUERIES BUT ARE ALSO NEEDED THE FIELD FOR THE SENDER AND FOR THE RECIPIENT
const chatSchema = mongoose.Schema({
    partecipants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }]
});

module.exports = mongoose.model("Chat", chatSchema);