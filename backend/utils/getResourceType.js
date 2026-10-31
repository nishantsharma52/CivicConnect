const getResourceType = (mimeType) => {
    if (mimeType.startsWith("image/")) {
        return "image";
    }

    if (mimeType.startsWith("video/")) {
        return "video";
    }

    return null;
};

export default getResourceType;