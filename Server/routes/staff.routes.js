
const express = require("express");
const router = express.Router();

const {
  createStaff,
  getAllStaff,
  getStaffByIdController,
  updateStaff,
  updateStaffStatus,
  resetStaffPassword,
  deleteStaff,
} = require("../controllers/staff.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// All routes require Admin authentication
router.use(protect, authorize("ADMIN"));

// Create receptionist
router.post("/", createStaff);

// Get all staff
router.get("/", getAllStaff);

// Get staff by ID
router.get("/:id", getStaffByIdController);

// Update staff details
router.patch("/:id", updateStaff);

// Activate / Deactivate staff
router.patch("/:id/status", updateStaffStatus);

// Reset staff password
router.patch("/:id/reset-password", resetStaffPassword);

// Delete staff
router.delete("/:id", deleteStaff);

module.exports = router;
