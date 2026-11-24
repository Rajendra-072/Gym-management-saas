
const Member = require("../Models/Member.model");
const Membership = require("../Models/Membership.model");
const Attendance = require("../Models/Attendance.model");
const Enquiry = require("../Models/Enquiry.model");
const Notification = require("../Models/Notification.model");

const getDashboardSummary = async (req, res) => {
  try {
    const gymId = req.user.gymId;

    const now = new Date();

    // Today's date range
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Seven days from today
    const sevenDaysLater = new Date(startOfDay);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
      activeMemberships,
      expiredMemberships,
      expiringMemberships,
      todayAttendance,
      pendingEnquiries,
      unreadNotifications,
      recentMembers,
      recentEnquiries,
    ] = await Promise.all([
      // Total members
      Member.countDocuments({ gymId }),

      // Active members
      Member.countDocuments({ gymId, isActive: true }),

      // Inactive members
      Member.countDocuments({ gymId, isActive: false }),

      // Active memberships valid today
      Membership.countDocuments({
        gymId,
        status: "ACTIVE",
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),

      // Expired memberships
      Membership.countDocuments({
        gymId,
        $or: [
          { status: "EXPIRED" },
          { status: "ACTIVE", endDate: { $lt: now } },
        ],
      }),

      // Memberships expiring within next seven days
      Membership.countDocuments({
        gymId,
        status: "ACTIVE",
        endDate: {
          $gte: startOfDay,
          $lte: sevenDaysLater,
        },
      }),

      // Today's attendance
      Attendance.countDocuments({
        gymId,
        attendanceDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),

      // Pending enquiries
      Enquiry.countDocuments({
        gymId,
        status: "NEW",
      }),

      // Unread notifications of logged-in Admin
      req.user.role === "ADMIN"
        ? Notification.countDocuments({
            gymId,
            recipientId: req.user.userId,
            isRead: false,
          })
        : Promise.resolve(0),

      // Recently registered members
      Member.find({ gymId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name phone memberCode createdAt"),

      // Recent enquiries
      Enquiry.find({ gymId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name phone email status createdAt"),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        members: {
          total: totalMembers,
          active: activeMembers,
          inactive: inactiveMembers,
        },

        memberships: {
          active: activeMemberships,
          expired: expiredMemberships,
          expiringInSevenDays: expiringMemberships,
        },

        attendance: {
          today: todayAttendance,
        },

        enquiries: {
          pending: pendingEnquiries,
        },

        notifications: {
          unread: unreadNotifications,
        },

        recentMembers,
        recentEnquiries,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
};
