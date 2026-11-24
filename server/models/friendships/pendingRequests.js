const mongoose = require("mongoose");

//DON'T USE A FIELD FOR THE STATUS OF THE REQUEST BECAUSE IF IT'S PENDING THE ENTRY REMAINS IN THE DB, WHILE IF IT'S ACCEPTED OR REJECTED THE ENTRY WILL BE REMOVED FROM THE DB
const pendingRequestSchema = mongoose.Schema({
    senderUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipientUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: Date
});

module.exports = mongoose.model("PendingRequest", pendingRequestSchema);