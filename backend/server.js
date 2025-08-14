const cors = require("cors");
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const https = require("https");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
// ✅ Load SSL certificates
const privateKey = fs.readFileSync(
  path.join(__dirname, "certs", "key.pem"),
  "utf8"
);
const certificate = fs.readFileSync(
  path.join(__dirname, "certs", "cert.pem"),
  "utf8"
);
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials, app);

// Middleware
app.use(
  cors({
    origin: "https://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

// Uploads folder
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
app.use("/uploads", express.static(uploadPath));

// Route registration
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

// MongoDB Models
const Message = require("./models/Message");
const User = require("./models/User");
const Chat = require("./models/Chat");

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "https://localhost:5173",
    methods: ["GET", "POST"],
  },
});
const onlineUsers = new Map();
app.set("io", io);

// Utility
const getRoomId = (email1, email2) => [email1, email2].sort().join("-");

const emailToSockets = new Map();

io.on("connection", (socket) => {

  console.log("🔌 User connected:", socket.id);

  socket.on("join_chat", ({ senderEmail, receiverEmail }) => {
    const roomId = getRoomId(senderEmail, receiverEmail);
    socket.join(roomId);

    if (!emailToSockets.has(senderEmail)) {
      emailToSockets.set(senderEmail, new Set());
    }
    emailToSockets.get(senderEmail).add(socket.id);

    onlineUsers.set(socket.id, senderEmail);
    console.log(`📥 ${senderEmail} joined room ${roomId}`);
  });

  socket.on("send_message", async (message) => {
    const roomId = getRoomId(message.senderEmail, message.receiverEmail);
    try {
      const senderUser = await User.findOne({ email: message.senderEmail });

      const enrichedMessage = {
        ...message,
        senderName: senderUser?.name || message.senderEmail,
      };
      io.to(roomId).emit("receive_message", enrichedMessage);
    } catch (error) {
      console.error("❌ Error sending real-time message:", error);
    }
  });

  // Jab koi call kare
  socket.on("call-user", ({ to, signal, from, name }) => {
    const targetedSocketId = emailToSocket.get(to);
    console.log(`📞 Call from ${from} to ${to}, socket: ${targetedSocketId}`);

    if (targetedSocketId) {
      io.to(targetedSocketId).emit("call-made", {
        signal,
        from,
        name,
      });
    } else {
      console.warn(`⚠️ No socket found for ${to}`);
    }
  });

  //jab koi call accept ho jaaye
  socket.on("make-answer", ({ to, signal, from }) => {
    const targetSocketId = emailToSocket.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("answer-made", {
        signal,
        from,
      });
    }
  });

  // ice-candidate transfer
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = emailToSocket.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    const targetSocketId = emailToSocket.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("end-call");
    }
  });

  socket.on("reject-call", ({ to, from }) => {
    const targetSocketId = emailToSocket.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("end-call");
    }
  });

  socket.on("disconnect", () => {
    const userEmail = onlineUsers.get(socket.id);
    if (userEmail) {
      onlineUsers.delete(socket.id);
      const sockets = emailToSockets.get(userEmail);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          emailToSockets.delete(userEmail);
        }
      }
      io.emit("update_online_users", Array.from(onlineUsers.values()));
      console.log(`❌ ${userEmail} disconnected`);
    } else {
      console.log("⚠️ Unknown user disconnected");
    }
  });
});

// MongoDB connection and server start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ HTTPS Server running at https://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });

// Global error handler
app.use((err, req, res, next) => {
  console.error("❗ Server Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
