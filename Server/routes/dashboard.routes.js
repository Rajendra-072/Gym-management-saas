
const express = require("express");
const router = express.Router();

const {
  getDashboardSummary,
} = require("../controllers/dashboard.controller");

const {
  protect,
  authorize,
} = require("../Middleware/auth.middleware");

// Admin and Receptionist dashboard access
router.get(
  "/summary",
  protect,
  authorize("ADMIN", "RECEPTIONIST"),
  getDashboardSummary
);

module.exports = router;
