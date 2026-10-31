import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const createNotification = async ({
    user,
    complaint = null,
    title,
    message,
    type = "general",
}) => {
    if (!user) return null;

    return Notification.create({
        user,
        complaint,
        title,
        message,
        type,
    });
};

export const createNotifications = async (notifications = []) => {
    const valid = notifications.filter((item) => item?.user);
    if (!valid.length) return [];
    return Notification.insertMany(valid);
};

export const notifyDepartmentStaff = async ({
    departmentId,
    complaint,
    title,
    message,
    type = "complaint_assigned",
}) => {
    if (!departmentId) return [];

    const staff = await User.find({
        department: departmentId,
        role: "department",
        isActive: true,
    }).select("_id");

    return createNotifications(
        staff.map((member) => ({
            user: member._id,
            complaint,
            title,
            message,
            type,
        }))
    );
};

export const notifyAdmins = async ({
    complaint,
    title,
    message,
    type = "general",
}) => {
    const admins = await User.find({
        role: "admin",
        isActive: true,
    }).select("_id");

    return createNotifications(
        admins.map((admin) => ({
            user: admin._id,
            complaint,
            title,
            message,
            type,
        }))
    );
};
