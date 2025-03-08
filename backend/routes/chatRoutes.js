const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const upload = require("../middlewares/multer"); // ✅ Import Multer for file uploads

// ✅ Fetch all messages for a specific room
router.get("/:roomId", async (req, res) => {
    const { roomId } = req.params;
    try {
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.error("❌ Error fetching messages:", error);
        res.status(500).json({ error: "Error fetching messages" });
    }
});

// ✅ Upload Image/Video/Audio & Save to Chat
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        console.log("🔹 Uploaded file details:", req.file); // ✅ Debug log
        
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded!" });
        }

        const { sender, roomId, type } = req.body;
        const fileUrl = req.file.secure_url || req.file.url; // ✅ Ensure correct URL field

        if (!fileUrl) {
            console.error("❌ Cloudinary URL missing!", req.file); // Debug log
            return res.status(500).json({ error: "Cloudinary URL missing" });
        }

        const newMessage = new Message({
            sender,
            roomId,
            message: fileUrl, // ✅ Store Cloudinary URL
            type, // 'image', 'video', 'audio'
            timestamp: new Date(),
        });

        await newMessage.save();

        // ✅ Emit the new message to clients in the room
        const io = req.app.get("socketio");
        io.to(roomId).emit("receiveMessage", newMessage);

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("❌ Error uploading file:", error);
        res.status(500).json({ error: "Error uploading file" });
    }
});


// ✅ Save a New Text Message
router.post("/", async (req, res) => {
    const { sender, roomId, message, language } = req.body;
    try {
        const newMessage = new Message({ sender, roomId, message, language });
        await newMessage.save();

        // ✅ Emit new text message via Socket.io
        const io = req.app.get("socketio");
        io.to(roomId).emit("receiveMessage", newMessage);

        res.status(201).json({ message: "Message saved" });
    } catch (error) {
        console.error("❌ Error saving message:", error);
        res.status(500).json({ error: "Error saving message" });
    }
});

// ✅ Delete all messages from a room (Optional)
router.delete("/:roomId", async (req, res) => {
    const { roomId } = req.params;
    try {
        await Message.deleteMany({ roomId });
        res.json({ message: `All messages in room ${roomId} deleted` });
    } catch (error) {
        console.error("❌ Error deleting messages:", error);
        res.status(500).json({ error: "Error deleting messages" });
    }
});

module.exports = router;
