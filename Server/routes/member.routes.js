
const express = require("express");
const router = express.Router();

const {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  updateMemberStatus,
  createMemberAccount,
  getMyMemberProfile,
  updateMyMemberProfile,
  getMyMembership,
  getMyAttendance,
  getMyMemberDashboard,
} = require("../Controllers/member.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// =====================================
// MEMBER PORTAL ROUTES
// =====================================

// Member Dashboard
router.get(
  "/me/dashboard",
  protect,
  authorize("MEMBER"),
  getMyMemberDashboard
);

// Member Profile
router.get(
  "/me/profile",
  protect,
  authorize("MEMBER"),
  getMyMemberProfile
);

// Update Own Profile
router.patch(
  "/me/profile",
  protect,
  authorize("MEMBER"),
  updateMyMemberProfile
);

// Own Membership Details
router.get(
  "/me/membership",
  protect,
  authorize("MEMBER"),
  getMyMembership
);

// Own Attendance History
router.get(
  "/me/attendance",
  protect,
  authorize("MEMBER"),
  getMyAttendance
);

// =====================================
// ADMIN / RECEPTIONIST ROUTES
// =====================================

// Create Member
router.post(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  createMember
);

// Get All Members
router.get(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getMembers
);

// Create Member Login Account
router.post(
  "/:id/create-account",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  createMemberAccount
);

// Get Single Member
router.get(
  "/:id",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getMemberById
);

// Update Member
router.patch(
  "/:id",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  updateMember
);

// Activate / Deactivate Member
router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  updateMemberStatus
);

module.exports = router;
