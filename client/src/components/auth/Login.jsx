import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../../layouts/AuthLayout"; // Common Auth Layout

const Login = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "https://localhost:5000/api/auth/login",
        { email },
        { withCredentials: true }
      );

      if (res.data.userFound === false) {
        alert("User not found. Redirecting to sign-up...");
        setTimeout(() => {
          navigate("/signup");
        }, 1000);
        return;
      }

      if (res.data.success) {
        navigate("/verify-otp", { state: { email, isSignup: false } });
      } else {
        alert("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <AuthLayout title="Welcome Back">
      <form onSubmit={handleLogin} className="space-y-5">
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
          Login
        </button>
      </form>

      <p className="text-sm mt-6 text-center text-purple-200">
        Don’t have an account?{" "}
        <button
          className="text-pink-400 hover:text-pink-300 transition"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </button>
      </p>
    </AuthLayout>
  );
};

export default Login;
