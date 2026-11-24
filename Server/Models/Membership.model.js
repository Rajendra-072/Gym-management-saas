
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },

    // Plan details snapshot
    planName: {
      type: String,
      required: true,
      trim: true,
    },

    planPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    durationType: {
      type: String,
      enum: ["DAYS", "MONTHS", "YEARS"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ gymId: 1, memberId: 1 });
membershipSchema.index({ gymId: 1, status: 1, endDate: 1 });

const Membership = mongoose.model("Membership", membershipSchema);

module.exports = Membership;
