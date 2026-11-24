
const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    memberCode: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "OTHER",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relationship: { type: String, default: "" },
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Member code must be unique within each gym
memberSchema.index(
  { gymId: 1, memberCode: 1 },
  { unique: true }
);

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
