import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../../layouts/AuthLayout"; // Common layout import

const SignUp = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://localhost:5000/api/auth/signup", { email });
      navigate("/verify-otp", { state: { email, isSignup: true } });
    } catch (err) {
      console.error(err);
      alert("Error sending OTP. Please try again.");
    }
  };

  return (
    <AuthLayout title="Create New Account">
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-5 py-3 rounded-lg bg-white/20 border border-purple-400/50 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-white font-semibold tracking-wide shadow-lg hover:opacity-90 transition duration-200"
        >
          Sign Up
        </button>
      </form>

      <p className="text-sm mt-6 text-center text-purple-200">
        Already have an account?{" "}
        <button
          className="text-pink-400 hover:text-pink-300 transition"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </p>
    </AuthLayout>
  );
};

export default SignUp;
