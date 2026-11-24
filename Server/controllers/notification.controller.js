
const Notification = require("../Models/Notification.model");

// Get all notifications of logged-in Admin
const getNotifications = async (req, res) => {
  try {
    const { isRead } = req.query;

    const filter = {
      gymId: req.user.gymId,
      recipientId: req.user.userId,
    };

    if (isRead !== undefined) {
      if (!["true", "false"].includes(isRead)) {
        return res.status(400).json({
          success: false,
          message: "isRead must be true or false",
        });
      }

      filter.isRead = isRead === "true";
    }

    const notifications = await Notification.find(filter)
      .populate("relatedMember", "name phone memberCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      gymId: req.user.gymId,
      recipientId: req.user.userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark one notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      gymId: req.user.gymId,
      recipientId: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        gymId: req.user.gymId,
        recipientId: req.user.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
