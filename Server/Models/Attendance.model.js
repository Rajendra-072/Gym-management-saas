
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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

    attendanceDate: {
      type: Date,
      required: true,
    },

    checkIn: {
      type: Date,
      required: true,
      default: Date.now,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["PRESENT", "LATE"],
      default: "PRESENT",
    },

    markedBy: {
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

// One attendance record per member per gym per day
attendanceSchema.index(
  { gymId: 1, memberId: 1, attendanceDate: 1 },
  { unique: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
