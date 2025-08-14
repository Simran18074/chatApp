import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [invalidUser, setInvalidUser] = useState(false);
  const navigate = useNavigate();

  // 🔄 Load currentUser from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (err) {
        console.error("Invalid currentUser data in localStorage");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // ✅ Check if currentUser exists in backend
  useEffect(() => {
    const verifyUser = async () => {
      if (!currentUser) return;

      try {
        const { data } = await axios.get("https://localhost:5000/api/users");
        const exists = data.some((u) => u.email === currentUser.email);

        if (!exists) {
          setInvalidUser(true); // triggers render
        }
      } catch (err) {
        console.error("Error verifying user: ", err);
        alert("Server error while checking user.");
      }
    };

    verifyUser();
  }, [currentUser]);

  // ⏳ Redirect after 2 seconds if invalidUser
  useEffect(() => {
    if (invalidUser) {
      const timer = setTimeout(() => {
        localStorage.removeItem("user");
        navigate("/signup");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [invalidUser, navigate]);

  // 🔄 Load chatWith from localStorage
  useEffect(() => {
    if (!currentUser) return;

    const savedChatWith = localStorage.getItem(`chatWith_${currentUser.email}`);
    if (savedChatWith) {
      try {
        setChatWith(JSON.parse(savedChatWith));
      } catch (err) {
        console.error("Invalid chatWith data in localStorage");
        localStorage.removeItem(`chatWith_${currentUser.email}`);
      }
    }
  }, [currentUser]);

  // ✅ Handle user selection
  const handleSelectUser = (userObj) => {
    if (!currentUser) return;
    setChatWith(userObj);
    localStorage.setItem(`chatWith_${currentUser.email}`, JSON.stringify(userObj));
  };

  // 🚫 Not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        You must be logged in to access the chat.
      </div>
    );
  }

  // ❗️Invalid user message shown before redirect
  if (invalidUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        User not found. Redirecting to sign-up...
      </div>
    );
  }

  // ✅ Main chat layout
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar
        user={currentUser}
        selectedUser={chatWith}
        onSelectUser={handleSelectUser}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chat App</h1>
          {chatWith ? (
            <span className="text-lg font-medium text-gray-700">
              Chatting with: <span className="text-blue-600">{chatWith.name}</span>
            </span>
          ) : (
            <span className="text-lg text-red-600">No user selected</span>
          )}
        </div>

        {chatWith ? (
          <div className="flex-1">
            <ChatWindow selectedUser={chatWith} currentUser={currentUser} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
            Please select a user from the sidebar to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
