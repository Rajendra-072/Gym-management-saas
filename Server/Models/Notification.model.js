
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "MEMBERSHIP_EXPIRING",
        "MEMBERSHIP_EXPIRED",
        "GENERAL",
      ],
      default: "GENERAL",
    },

    relatedMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },

    relatedMembership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({
  gymId: 1,
  recipientId: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

module.exports = Notification;
