
const mongoose = require("mongoose");

const membershipPlanSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    durationType: {
      type: String,
      enum: ["DAYS", "MONTHS", "YEARS"],
      default: "MONTHS",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    features: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const MembershipPlan = mongoose.model(
  "MembershipPlan",
  membershipPlanSchema
);

module.exports = MembershipPlan;
