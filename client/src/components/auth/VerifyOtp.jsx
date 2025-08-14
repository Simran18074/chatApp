import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../../layouts/AuthLayout"; // Common Layout

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const [email] = useState(
    location.state?.email || localStorage.getItem("pendingEmail") || ""
  );
  const isSignup =
    location.state?.isSignup || localStorage.getItem("isSignup") === "true";

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  useEffect(() => {
    const timer =
      seconds > 0 && setInterval(() => setSeconds((prev) => prev - 1), 1000);

    if (seconds === 0) setCanResend(true);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedOtp = otp.trim();

    try {
      const res = await axios.post(
        "https://localhost:5000/api/auth/verify-otp",
        { email: cleanedEmail, otp: cleanedOtp },
        { withCredentials: true }
      );

      if (res.data?.success) {
        if (!res.data.user) {
          alert(
            "OTP verified but user data is missing. Please contact support."
          );
          return;
        }

        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }

        const { name = "", email: verifiedEmail = "" } = res.data.user;
        if (!verifiedEmail) {
          alert("User email missing in response. Cannot proceed.");
          return;
        }

        localStorage.setItem(
          "user",
          JSON.stringify({ email: verifiedEmail, name })
        );
        localStorage.removeItem("pendingEmail");
        localStorage.removeItem("isSignup");

        if (!name) {
          navigate("/set-name", { state: { email: verifiedEmail } });
        } else {
          navigate("/chat");
        }
      } else {
        alert("OTP verification failed. Please try again.");
      }
    } catch (error) {
      alert("Invalid or expired OTP. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    try {
      const endpoint = isSignup ? "request-signup" : "request-login";
      await axios.post(`https://localhost:5000/api/auth/${endpoint}`, {
        email: email.trim().toLowerCase(),
      });
      setSeconds(30);
      setCanResend(false);
      alert("OTP resent to email");
    } catch (err) {
      alert("Failed to resend OTP");
    }
  };

  return (
    <AuthLayout title="Verify OTP">
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-5 py-3 rounded-lg bg-white/20 border border-purple-400/50 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white font-semibold tracking-wide shadow-lg hover:opacity-90 transition duration-200"
        >
          Verify
        </button>
      </form>

      <div className="text-center mt-6">
        {!canResend ? (
          <p className="text-purple-200">Resend OTP in {seconds}s</p>
        ) : (
          <button
            onClick={handleResendOtp}
            className="text-pink-400 hover:text-pink-300 transition"
          >
            Resend OTP
          </button>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
