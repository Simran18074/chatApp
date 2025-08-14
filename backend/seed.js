const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");

const users = [
  {
    name: "Simran",
    email: "simran181204@gmail.com",
    avatar: "👩‍🦰",
  },
  {
    name: "Muskan",
    email: "s4982420@gmail.com",
    avatar: "👩",
  },
  {
    name: "Rupesh",
    email: "Rupesh@example.com",
    avatar: "👨",
  },
];

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected...");
    await User.deleteMany(); // optional
    await User.insertMany(users);
    console.log("Users inserted!");
    process.exit();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
