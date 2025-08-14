const Chat = require("../models/Chat");
const User = require("../models/User");

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find().populate("participants", "email");
    res.json(chats);
  } catch (error) {
    console.error("❌ Failed to fetch chats:", error);
    res.status(500).json({ error: "Failed to get chats" });
  }
};

const createChat = async (req, res) => {
  const { participants } = req.body;
  if (!participants || participants.length !== 2) {
    return res.status(400).json({ error: "2 participants required" });
  }

  try {
    const users = await User.find({ email: { $in: participants } });
    if (users.length !== 2) {
      return res.status(404).json({ error: "One or more users not found" });
    }

    // Check for existing chat between these 2 users
    let existingChat = await Chat.findOne({
      participants: { $all: [users[0]._id, users[1]._id], $size: 2 },
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    // Create new chat
    const newChat = new Chat({ participants: [users[0]._id, users[1]._id] });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error("❌ Failed to create chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

module.exports = { getChats, createChat };
