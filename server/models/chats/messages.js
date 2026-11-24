const mongoose = require("mongoose");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// A SINGLE COLLECTIONS OF MESSAGES AND THE CHAT SCHEMA WITH AN ARRAY TO THE OBJECT ID IS NOT A GOOD SOLUTION FOR THE EFFICIENCE BUT THERE ARE POTENTILA TECHNIQUE LIKE DB SHARDING, CACHING, ETC. ///
/// (AVOIDED A SINGLE CHAT SCHEMA WITH AN ARRAY OF senderUser, message AND date)                                                                                                                    ///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//ONLY SENDER NEEDED BEACAUSE THE RECIPIENT(S) IS/ARE THE USER(S) SPECIFIED IN THE CHATS COLLECTION
const messageSchema = mongoose.Schema({
    senderUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: Date,
    type: {
        type: String,
        enum: ["TEXT", "IMAGE", "AUDIO", "VIDEO"]
    }
});

module.exports = mongoose.model("Message", messageSchema);