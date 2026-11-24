
const express = require("express");
const router = express.Router();

const {
  createMembershipPlan,
  getMembershipPlans,
  getPublicMembershipPlans,
  updateMembershipPlan,
  updateMembershipPlanStatus,
  deleteMembershipPlan,
} = require("../controllers/membershipPlan.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// Public: Anyone can view a gym's active plans
router.get("/public/:slug", getPublicMembershipPlans);

// Private: Logged-in gym users can view plans
router.get(
  "/",
  protect,
  authorize("ADMIN", "RECEPTIONIST", "MEMBER"),
  getMembershipPlans
);

// Admin only: Create plan
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createMembershipPlan
);

// Admin only: Update plan
router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateMembershipPlan
);

// Admin only: Activate / Deactivate plan
router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN"),
  updateMembershipPlanStatus
);

// Admin only: Delete plan
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteMembershipPlan
);

module.exports = router;
