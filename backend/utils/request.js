import mongoose from "mongoose";

export const isValidObjectId = (value) =>
    mongoose.Types.ObjectId.isValid(value);

export const parseMaybeJson = (value, fieldName = "value") => {
    if (value === undefined || value === null || value === "") {
        return value;
    }

    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value);
    } catch {
        const error = new Error(`${fieldName} must contain valid JSON`);
        error.statusCode = 400;
        throw error;
    }
};

export const getPagination = (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(Number.parseInt(query.limit, 10) || 20, 1),
        100
    );

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};
