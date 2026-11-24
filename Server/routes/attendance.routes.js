
const express = require("express");
const router = express.Router();

const {
  checkInMember,
  checkOutMember,
  getAllAttendance,
  getMemberAttendance,
  getDailyAttendanceSummary,
} = require("../controllers/attendance.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// Daily attendance summary
router.get(
  "/summary",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getDailyAttendanceSummary
);

// Member attendance history
router.get(
  "/member/:memberId",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getMemberAttendance
);

// Get all attendance records
router.get(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getAllAttendance
);

// Member check-in
router.post(
  "/check-in",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  checkInMember
);

// Member check-out
router.patch(
  "/check-out",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  checkOutMember
);

module.exports = router;
