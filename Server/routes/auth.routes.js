
const express = require("express");
const router = express.Router();

const {
  registerGym,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const { protect } = require("../Middleware/auth.middleware");

router.post("/register-gym", registerGym);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
