import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";

const SetName = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/signup");
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://localhost:5000/api/auth/set-name", {
        email,
        name,
      });
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userName", name);
      navigate("/chat");
    } catch (error) {
      alert("Error updating name");
    }
  };

  return (
    <AuthLayout title="Set Your Name">
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-5 py-3 rounded-lg bg-white/20 border border-purple-400/50 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-inner"
          required
        />
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white font-semibold tracking-wide shadow-lg hover:opacity-90 transition duration-200"
        >
          Continue
        </button>
      </form>
    </AuthLayout>
  );
};

export default SetName;
