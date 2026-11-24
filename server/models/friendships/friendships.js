const mongoose = require("mongoose");

//user1 MADE THE REQUEST
//user2 ACCEPTED THE REQUEST
const friendshipSchema = mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    acceptDate: Date
});

module.exports = mongoose.model("Friendship", friendshipSchema);