const mongoose = require("mongoose");

const storySchema = mongoose.Schema({
    type: {
        type: String,
        enum: ["IMAGE", "VIDEO", "MOOD"]
    },
    // Relative path within the private server-side stories directory, never a public URL.
    storagePath: String,
    contentURL: {
        type: String,
        required: function() {
            return this.type === "IMAGE" || this.type === "VIDEO";
        }
    },
    mood: {
        backgroundColor: {
            type: String,
            required: function() {
                return this.type === "MOOD";
            }
        },
        subtitle: {
            type: String,
            required: function() {
                return this.type === "MOOD";
            },
            maxLength: 50
        }
    },
    date: Date,
    expireDate: Date,
    seenUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

module.exports = mongoose.model("Story", storySchema);