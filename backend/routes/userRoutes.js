const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/", async (req, res) => {
  const currentEmail = req.query.currentEmail;

  try {
    const users = await User.find(
      { email: { $ne: currentEmail } }, // exclude current user
      "name email"
    );
    
    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
