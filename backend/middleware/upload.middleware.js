import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "video/mp4",
    "video/webm",
    "video/mov",
    "video/quicktime",
]);

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
        return cb(null, true);
    }

    return cb(
        new Error(
            "Only JPG, JPEG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed"
        ),
        false
    );
};

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 5,
    },
    fileFilter,
});

export default upload;
