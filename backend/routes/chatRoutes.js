const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");

// GET all chats for a user by email
router.get("/", async (req, res) => {
  try {
    const { userEmail } = req.query;
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const chats = await Chat.find({ participants: user._id }).populate(
      "participants",
      "email"
    );
    res.json(chats);
  } catch (error) {
    console.error("❌ Error getting chats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST: Create or get 1-on-1 chat between two users
router.post("/", async (req, res) => {
  try {
    const { participants } = req.body;
    if (!participants || participants.length !== 2) {
      return res.status(404).json({ error: "Exactly 2 participants required" });
    }

    const [email1, email2] = participants;
    const user1 = await User.findOne({ email: email1 });
    const user2 = await User.findOne({ email: email2 });

    if (!user1 || !user2) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [user1._id, user2._id], $size: 2 },
    });

    if (!chat) {
      chat = new Chat({ participants: [user1._id, user2._id] });
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    console.error("❌ Error creating chat:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
