import Notification from "../models/notification.model.js";


// GET MY NOTIFICATIONS
export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user.userId,
        })
            .populate("complaint", "complaintId title status")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Notifications fetched successfully",
            notifications,
        });

    } catch (error) {
        console.error("Get Notifications Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET UNREAD NOTIFICATIONS
export const getUnreadNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user.userId,
            isRead: false,
        })
            .populate("complaint", "complaintId title status")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Unread notifications fetched successfully",
            notifications,
            unreadCount: notifications.length,
        });

    } catch (error) {
        console.error("Get Unread Notifications Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// MARK ONE NOTIFICATION AS READ
export const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({
            message: "Notification marked as read",
            notification,
        });

    } catch (error) {
        console.error("Mark Notification Read Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                user: req.user.userId,
                isRead: false,
            },
            {
                $set: {
                    isRead: true,
                },
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read",
        });

    } catch (error) {
        console.error("Mark All Notifications Read Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// DELETE NOTIFICATION
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        await Notification.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Notification deleted successfully",
        });

    } catch (error) {
        console.error("Delete Notification Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};