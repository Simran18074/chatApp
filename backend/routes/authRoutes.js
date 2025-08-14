const express = require("express");
const router = express.Router();
const {
  requestSignup,
  requestLogin,
  verifyOtp,
  setName,
} = require("../controllers/authController");

// Routes
router.post("/signup", requestSignup);
router.post("/login", requestLogin); // ✅ Now defined
router.post("/verify-otp", verifyOtp);
router.post("/set-name", setName);

module.exports = router;
