
const express = require("express");
const router = express.Router();

const {
  assignMembership,
  getMemberships,
  getMembershipById,
  cancelMembership,
  renewMembership,
} = require("../controllers/membership.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// Assign membership
router.post(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  assignMembership
);

// Get all memberships
router.get(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getMemberships
);

// Get single membership
router.get(
  "/:id",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getMembershipById
);

// Cancel membership
router.patch(
  "/:id/cancel",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  cancelMembership
);

// Renew membership
router.post(
  "/:id/renew",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  renewMembership
);

module.exports = router;
