
const express = require("express");
const router = express.Router();

const {
  createFacility,
  getFacilities,
  getPublicFacilities,
  updateFacility,
  updateFacilityStatus,
  deleteFacility,
} = require("../controllers/facility.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// Public: Anyone can view a gym's facilities
router.get("/public/:slug", getPublicFacilities);

// Private: Logged-in gym users can view facilities
router.get(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST", "MEMBER"),
  getFacilities
);

// Admin only: Create facility
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createFacility
);

// Admin only: Update facility
router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateFacility
);

// Admin only: Activate / Deactivate facility
router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN"),
  updateFacilityStatus
);

// Admin only: Delete facility
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteFacility
);

module.exports = router;
