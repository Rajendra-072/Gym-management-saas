
const express = require("express");
const router = express.Router();

const {
  getAttendanceReport,
  getMembershipReport,
  getMemberGrowthReport,
  getMembershipExpiryReport,
  getEnquiryReport,
} = require("../controllers/report.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// All report routes require Admin authentication
router.use(protect, authorize("ADMIN"));

// 1. Attendance Report
router.get("/attendance", getAttendanceReport);

// 2. Membership Report
router.get("/memberships", getMembershipReport);

// 3. Member Growth Report
router.get("/member-growth", getMemberGrowthReport);

// 4. Membership Expiry Report
router.get("/membership-expiry", getMembershipExpiryReport);

// 5. Enquiry Report
router.get("/enquiries", getEnquiryReport);

module.exports = router;
