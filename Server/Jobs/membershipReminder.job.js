
const cron = require("node-cron");

const Membership = require("../Models/Membership.model");
const Notification = require("../Models/Notification.model");
const User = require("../Models/User.model");

const runMembershipReminderJob = async () => {
  try {
    console.log("Membership reminder job started");

    const now = new Date();

    // Find all active memberships
    const memberships = await Membership.find({
      status: "ACTIVE",
    }).populate("memberId", "name");

    // Find all Admins
    const admins = await User.find({
      role: "ADMIN",
      isActive: true,
    }).select("_id gymId");

    for (const membership of memberships) {
      if (!membership.endDate || !membership.memberId) {
        continue;
      }

      const endDate = new Date(membership.endDate);

      const daysLeft = Math.ceil(
        (new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        ) -
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          )) /
          (1000 * 60 * 60 * 24)
      );

      // Automatically expire memberships
      if (daysLeft < 0) {
        membership.status = "EXPIRED";
        await membership.save();
      }

      let type;
      let title;
      let message;

      if (daysLeft === 7) {
        type = "MEMBERSHIP_EXPIRING";
        title = "Membership Expiring Soon";
        message = `${membership.memberId.name}'s membership will expire in 7 days.`;
      } else if (daysLeft === 0) {
        type = "MEMBERSHIP_EXPIRED";
        title = "Membership Expiring Today";
        message = `${membership.memberId.name}'s membership expires today.`;
      } else if (daysLeft < 0) {
        type = "MEMBERSHIP_EXPIRED";
        title = "Membership Expired";
        message = `${membership.memberId.name}'s membership has expired.`;
      } else {
        continue;
      }

      // Notify only Admins of the same gym
      const gymAdmins = admins.filter(
        (admin) =>
          admin.gymId.toString() === membership.gymId.toString()
      );

      for (const admin of gymAdmins) {
        // Prevent duplicate notifications
        const existingNotification = await Notification.findOne({
          gymId: membership.gymId,
          recipientId: admin._id,
          relatedMembership: membership._id,
          type,
        });

        if (existingNotification) {
          continue;
        }

        await Notification.create({
          gymId: membership.gymId,
          recipientId: admin._id,
          relatedMember: membership.memberId._id,
          relatedMembership: membership._id,
          type,
          title,
          message,
        });
      }
    }

    console.log("Membership reminder job completed");
  } catch (error) {
    console.error("Membership reminder job error:", error);
  }
};

// Run every day at 9:00 AM
const startMembershipReminderJob = () => {
  cron.schedule(
    "0 9 * * *",
    runMembershipReminderJob,
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("Membership reminder scheduler registered");
};

module.exports = {
  startMembershipReminderJob,
  runMembershipReminderJob,
};
