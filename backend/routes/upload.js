const express = require("express");
const router = express.Router();
const upload = require("../midleware/upload"); // Import the Multer config

// ✅ Upload File Route
router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) {
        console.error("❌ No file received!");
        return res.status(400).json({ error: "No file uploaded!" });
    }

    console.log("✅ File uploaded:", req.file);

    res.json({
        url: req.file.path,  // Ensure this exists
        filename: req.file.filename,
    });
});

module.exports = router;
