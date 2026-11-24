
const express = require("express");
const router = express.Router();

const {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} = require("../Controllers/enquiry.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// Public: Visitor can submit enquiry without login
router.post("/public/:slug", createEnquiry);

// Admin and Receptionist: View enquiries
router.get(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getEnquiries
);

// Admin and Receptionist: Update enquiry status
router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  updateEnquiryStatus
);

// Admin only: Delete enquiry
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteEnquiry
);

module.exports = router;
