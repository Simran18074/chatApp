const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,         
    required: true,
  },
  receiverEmail: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  files: [
    {
      name: { type: String },
      url: { type: String },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);
