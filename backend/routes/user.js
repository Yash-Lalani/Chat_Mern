const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Sign-up Route
router.post("/sign-up", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (username.length < 4) {
            return res.status(400).json({ message: "Username length should be greater than 3" });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already taken" });
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already in use" });
        }
        if (password.length <= 5) {
            return res.status(400).json({ message: "Password should be greater than 5 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Sign-in Route
router.post("/sign-in", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
            return res.status(401).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = jwt.sign({ id: existingUser._id, role: existingUser.role }, "chatmern123", { expiresIn: "30d" });

        res.status(200).json({
            id: existingUser._id,
            token: token,
            role: existingUser.role,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router; // ✅ Make sure to export `router` properly
