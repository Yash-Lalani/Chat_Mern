const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: "chat-media",
        resource_type: "auto", // Auto-detects images, videos, and audio
        public_id: `${Date.now()}-${file.originalname}`,
    }),
});
const upload = multer({ storage });

module.exports = upload;
