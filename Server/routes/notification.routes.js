
const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notification.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// All routes require Admin authentication
router.use(protect, authorize("ADMIN"));

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

// Get all notifications
router.get("/", getNotifications);

// Mark one notification as read
router.patch("/:id/read", markNotificationAsRead);

module.exports = router;
