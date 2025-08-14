const OtpToken = require("../models/OtpToken");
const sendOtpEmail = require("../utils/sendEmail");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const createToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sendTokenAsCookie = (res, token) => {
  //const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: true, // Local me false
    sameSite: "None" ,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ✅ Reusable function for sending OTP via email
const requestOtp = async (email, res) => {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await OtpToken.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true }
    );

    await sendOtpEmail(email, otp);
    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP request error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ✅ Signup — sends OTP
exports.requestSignup = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  await requestOtp(email, res);
};

// ✅ Login — checks for existing user and sends OTP
exports.requestLogin = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        userFound: false,
        message: "User not found. Redirecting to sign up...",
      });
    }

    // If user exists, send OTP
    await requestOtp(email, res);
  } catch (err) {
    console.error("Login OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ OTP verification for signup/login
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required" });
  }

  try {
    console.log("VERIFY OTP DEBUG:", { email, otp });
    const recordDebug = await OtpToken.findOne({ email });
    console.log("DB Record:", recordDebug);

    const record = await OtpToken.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    await OtpToken.deleteOne({ email });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email }); // name will be set later
    }
    const token = createToken(user);
    sendTokenAsCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      user,
      token,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// ✅ Set user's name after OTP verification
exports.setName = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res
      .status(400)
      .json({ success: false, message: "Email and name are required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { name },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Name updated successfully",
      user,
    });
  } catch (err) {
    console.error("Set name error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
