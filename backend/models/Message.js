const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    username: String,
    roomId: String,  // ✅ Add roomId for filtering messages
    message: String, // ✅ This will store the text or media URL
    type: { type: String, enum: ["text", "image", "video", "audio", "file"], required: true }, // ✅ Add this
    language: String,
    translations: { type: Map, of: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
