const express = require("express");
const {
  getMessages,
  postMessage,
} = require("../controllers/messageController");
// const Message = require("../models/Message");

const router = express.Router();

router.get("/:chatId", async (req, res, next) => {
  try {
    await getMessages(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    await postMessage(req, res);
  } catch (err) {
    next(err);
  }
});

/*
router.delete("/deleteByEmail/:email", async (req, res) => {
  try {
    const email = req.params.email;
    await Message.deleteMany({
      $or: [{ senderEmail: email }, { receiverEmail: email }],
    });
    res.status(200).json({ message: "Messages deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});  */

module.exports = router;
