const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    name: { type: String, default: "", index: true }, // Ensures `name` is never `null`
    roomId: { type: String, required: true, unique: true }, // Unique room ID
    users: [{ type: String }], // List of users in the room
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
