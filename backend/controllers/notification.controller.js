import Notification from "../models/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

/*
 * Notifications are always created as a side effect of a real domain event
 * (see utils/notifier.js) - there is intentionally no public "create"
 * endpoint here. Everything below only ever touches the requesting user's
 * own notifications (recipient === req.user._id); there is no admin
 * override, matching "Users should only access their own notifications
 * unless admin functionality explicitly exists" - no such admin
 * requirement was described for notifications, so none is added.
 */

// GET /api/notifications - authenticated, own notifications
const getMyNotifications = catchAsync(async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const { page, limit, skip } = parsePagination(req.query);
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Notifications fetched", notifications, buildPaginationMeta({ page, limit, total }));
});

// GET /api/notifications/unread - authenticated
const getUnreadNotifications = catchAsync(async (req, res) => {
  const filter = { recipient: req.user._id, isRead: false };
  const { page, limit, skip } = parsePagination(req.query);
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Unread notifications fetched", notifications, buildPaginationMeta({ page, limit, total }));
});

// PATCH /api/notifications/:id/read - authenticated, own notification only
const markAsRead = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "notification id");
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw ApiError.notFound("Notification not found");
  return sendResponse(res, 200, "Notification marked as read", notification);
});

// PATCH /api/notifications/read-all - authenticated
const markAllAsRead = catchAsync(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return sendResponse(res, 200, "All notifications marked as read", { modifiedCount: result.modifiedCount });
});

// DELETE /api/notifications/:id - authenticated, own notification only
const deleteNotification = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "notification id");
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw ApiError.notFound("Notification not found");
  return sendResponse(res, 200, "Notification deleted", null);
});

export {
  getMyNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
