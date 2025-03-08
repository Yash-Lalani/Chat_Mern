require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Message = require("./models/Message");
const Room = require("./models/Room");
const userRoutes = require("./routes/user");
const app = express();
const server = http.createServer(app);
const uploadRoutes = require("./routes/upload");


const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const corsOptions = {
    origin: "https://chat-mern-frontend-git-main-yash-lalanis-projects.vercel.app", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };
  
  app.use(cors(corsOptions));
  
app.use(express.json());


// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

app.use("/api/v1", userRoutes);
app.use("/upload", uploadRoutes); 
app.use("/uploads", express.static("uploads"));


const jwt = require("jsonwebtoken");
// ✅ Store active users per room
const users = {};
const roomUsers = {}; // Track users in each room

// ✅ Google Translate API function
const translateMessage = async (text, targetLang) => {
    try {
        const response = await axios.get(
            `https://translate.googleapis.com/translate_a/single`,
            {
                params: {
                    client: "gtx",
                    sl: "auto",
                    tl: targetLang,
                    dt: "t",
                    q: text,
                },
            }
        );
        return response.data[0][0][0] || text;
    } catch (error) {
        console.error("❌ Translation Error:", error.message);
        return text;
    }
};

// ✅ Socket.io event handling
io.on("connection", (socket) => {
    console.log(`✅ New User Connected: ${socket.id}`);

    // ✅ Join Room
    socket.on("joinRoom", async ({ username, roomId, language }) => {
        socket.join(roomId);
    
        // ✅ Remove old socket if user refreshes
        Object.keys(users).forEach((socketId) => {
            if (users[socketId]?.username === username && users[socketId]?.roomId === roomId) {
                delete users[socketId]; // Remove old socket entry
            }
        });
    
        // ✅ Store new socket connection
        users[socket.id] = { username, roomId, language };
    
        // ✅ Ensure room exists
        if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
        roomUsers[roomId].add(socket.id);
    
        console.log(`📢 ${username} joined room: ${roomId} (Language: ${language})`);
    
        try {
            // ✅ Add room to DB if it doesn't exist
            let existingRoom = await Room.findOne({ roomId });
            if (!existingRoom) {
                existingRoom = new Room({ roomId, roomName: `Room ${roomId}` });
                await existingRoom.save();
                console.log(`✅ Room ${roomId} saved to DB`);
            }
        } catch (error) {
            console.error("❌ Error saving room:", error);
        }
    
        // ✅ Convert socket IDs to usernames (only active users)
        const updatedUsers = Array.from(roomUsers[roomId])
            .map(id => users[id]?.username)
            .filter(Boolean); // Remove undefined values
    
        // ✅ Notify all users in the room about the updated user list
        io.to(roomId).emit("updateUsers", updatedUsers);
    
        // ✅ Send previous messages
        try {
            const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
            socket.emit("loadMessages", messages);
        } catch (error) {
            console.error("❌ Error loading messages:", error);
        }
    });
    

    socket.on("leaveRoom", async (roomId) => {
        socket.leave(roomId);
        
        if (users[socket.id]) {
            delete users[socket.id]; // Remove user data
        }
    
        if (roomUsers[roomId]) {
            roomUsers[roomId].delete(socket.id);
    
            // ✅ Update room user list
            io.to(roomId).emit("updateUsers", Array.from(roomUsers[roomId]).map(id => users[id]?.username));
    
            // ✅ Delete room if empty
            if (roomUsers[roomId].size === 0) {
                console.log(`🚨 Room ${roomId} is empty. Deleting from DB.`);
                await Room.deleteOne({ roomId });
                delete roomUsers[roomId];
            }
        }
    
        console.log(`🚪 User left room: ${roomId}`);
    });
    
    

    // ✅ Handle Sending Messages
    socket.on("sendMessage", async ({ message, username, roomId, type = "text" }) => {
        try {
            const senderLanguage = users[socket.id]?.language || "en";
    
            // ✅ Prepare translations
            const translations = {};
            const clients = await io.in(roomId).fetchSockets();
    
            for (let client of clients) {
                const recipientLanguage = users[client.id]?.language || "en";
                if (senderLanguage !== recipientLanguage && type === "text") {
                    translations[recipientLanguage] = await translateMessage(message, recipientLanguage);
                }
            }
    
            // ✅ Save message in DB with translations
            const newMessage = new Message({ 
                username, 
                roomId, 
                message, 
                type, 
                language: senderLanguage, 
                translations 
            });
    
            await newMessage.save();
    
            // ✅ Send messages
            for (let client of clients) {
                const recipientLanguage = users[client.id]?.language || "en";
                const translatedMessage = translations[recipientLanguage] || message;
    
                io.to(client.id).emit("receiveMessage", { 
                    username, 
                    message: translatedMessage, 
                    type, 
                    language: recipientLanguage 
                });
            }
        } catch (error) {
            console.error("❌ Error Sending Message:", error);
        }
    });
    
    
    
    

    
    
    

    // ✅ Fetch Messages for Room
    socket.on("requestMessages", async (roomId) => {
        try {
            const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
            socket.emit("loadMessages", messages);
        } catch (error) {
            console.error("❌ Error Loading Messages:", error);
        }
    });

    // ✅ Handle User Disconnection
    socket.on("disconnect", async () => {
        console.log(`❌ User Disconnected: ${socket.id}`);
        const user = users[socket.id];

        if (user) {
            const { roomId } = user;
            delete users[socket.id];
            if (roomUsers[roomId]) {
                roomUsers[roomId].delete(socket.id);

                // ✅ Update room user list
                io.to(roomId).emit("updateUsers", Array.from(roomUsers[roomId]).map(id => users[id]?.username));

                // ✅ Delete room if empty
                if (roomUsers[roomId].size === 0) {
                    console.log(`🚨 Room ${roomId} is empty. Deleting from DB.`);
                    await Room.deleteOne({ roomId });
                    delete roomUsers[roomId];
                }
            }
        }
    });
});

// ✅ API Endpoint to Create Room
app.post("/create-room", async (req, res) => {
    try {
        const roomId = Math.random().toString(36).substr(2, 9); // Generate unique roomId
        const roomName = `Room-${roomId}`; // Ensure a valid name

        const newRoom = new Room({ roomId, name: roomName, users: [] }); 
        await newRoom.save();
        
        res.status(201).json({ roomId, name: roomName });
    } catch (error) {
        console.error("❌ Error saving room:", error);
        res.status(500).json({ error: "Failed to create room" });
    }
});


app.post("/check-room", async (req, res) => {
    const { roomId } = req.body;

    try {
        const roomExists = await Room.exists({ roomId }); // ✅ Check in Database
        res.json({ exists: !!roomExists }); // ✅ Returns true/false
    } catch (error) {
        console.error("Error checking room:", error);
        res.status(500).json({ exists: false });
    }
});

app.get("/", (req, res) => {
    res.send("🚀 Backend is running!");
});

// app.get("/api/v1/user", async (req, res) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1]; 
//         if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

//         const decoded = jwt.verify(token, "ksdsjdbsjbdjsbdjsb"); 
//         const user = await User.findById(decoded.id);

//         if (!user) return res.status(404).json({ message: "User not found" });

//         res.json({ username: user.username });
//     } catch (error) {
//         console.error("❌ Server error:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });



// ✅ Start Server
const PORT = process.env.Port|| 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
