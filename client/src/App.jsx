import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignUp from "./components/auth/SignUp";
import Login from "./components/auth/Login";
import VerifyOtp from "./components/auth/VerifyOtp";
import SetName from "./components/auth/SetName";
import Chat from "./pages/Chat";
import Galaxy from "../Reactbits/Galaxy/Galaxy";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Checking localStorage for user and token...");

    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    console.log("Stored user:", storedUser);
    console.log("Stored token:", storedToken);

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        console.log("User and token loaded successfully.");
      } catch (err) {
        console.error("Error parsing user JSON:", err);
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route
          path="/login"
          element={
            <div style={{ pointerEvents: "auto " }}>
              <Login />
            </div>
          }
        />
        <Route path="/set-name" element={<SetName />} />

        <Route
          path="/chat"
          element={
            user && token ? (
              <Chat currentUser={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
