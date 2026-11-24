
const express = require("express");
const router = express.Router();

const {
  getMyGym,
  updateGymProfile,
  getPublicGym,
} = require("../controllers/gym.controller");

const { protect, authorize } = require("../Middleware/auth.middleware");

// Public route - no login required
router.get("/public/:slug", getPublicGym);

// Protected route - Admin and Receptionist can view their gym
router.get(
  "/profile",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getMyGym
);

// Admin only - update gym profile
router.patch(
  "/profile",
  protect,
  authorize("ADMIN"),
  updateGymProfile
);

module.exports = router;
