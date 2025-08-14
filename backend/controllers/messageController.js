const Message = require("../models/Message");
const User = require("../models/User");

const getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

const postMessage = async (req, res) => {
  try {
    const { senderEmail, receiverEmail, text, chatId } = req.body;

    console.log("📥 Received message payload:", req.body);

    if (!senderEmail || !receiverEmail || !chatId) {
      return res
        .status(400)
        .json({ error: "senderEmail, receiverEmail, and chatId are required" });
    }

    const senderUser = await User.findOne({ email: senderEmail });
    const receiverUser = await User.findOne({ email: receiverEmail });

    if (!senderUser || !receiverUser) {
      return res.status(404).json({ error: "Sender or recipient not found" });
    }

    const uploadedFiles =
      req.files?.map((file) => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
      })) ||
      req.body.files ||
      [];

    const newMessage = new Message({
      senderEmail: senderUser.email,
      senderName:senderUser.name,
      receiverEmail: receiverUser.email,
      chatId,
      text: text || "",
      files: uploadedFiles, // should be an array of { name, url }
      timestamp: new Date(),
    });

    const savedMessage = await newMessage.save();

    res.status(201).json({
      ...savedMessage.toObject(),
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("❗ Server Error:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
};

module.exports = { getMessages, postMessage };
