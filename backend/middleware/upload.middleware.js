import multer from "multer";

// Store files temporarily in memory
const storage = multer.memoryStorage();

// Allowed file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "video/mp4",
        "video/webm",
        "video/mov",
        "video/quicktime",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed"
            ),
            false
        );
    }
};

// Multer configuration
const upload = multer({
    storage,

    limits: {
        // Maximum file size = 20 MB
        fileSize: 20 * 1024 * 1024,

        // Maximum number of files
        files: 5,
    },

    fileFilter,
});

export default upload;