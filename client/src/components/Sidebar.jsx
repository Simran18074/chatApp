import React, { useEffect, useState } from "react";
import axios from "axios";
import LogoutButton from "./LogoutButton";

const Sidebar = ({ user, onSelectUser, selectedUser }) => {
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("https://localhost:5000/api/users", {
          params: { currentEmail: user.email }, // ✅ Pass current user's email
        });
        setAvailableUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    if (user?.email) {
      fetchUsers();
    }
  }, [user]);

  return (
    <div className="w-64 h-screen bg-gray-100 p-4 border-r flex flex-col">
      <h2 className="text-xl font-bold mb-4">Chat App</h2>

      {/* Current User Info */}
      <div className="mb-6">
        <p className="font-semibold">
          {user?.avatar || "👤"} {user?.name || "User"}
        </p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Sidebar navigation buttons */}
      <div className="space-y-2 mb-6">
        <button className="w-full text-left p-2 rounded hover:bg-gray-200">
          🧑 Private Chat
        </button>
        <button className="w-full text-left p-2 rounded hover:bg-gray-200">
          👥 Group Chat
        </button>
        <button className="w-full text-left p-2 rounded hover:bg-gray-200">
          ⚙️ Settings
        </button>
      </div>

      {/* List of other users (Chats) */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-bold mb-2 text-gray-600">Chats</h3>
        <div className="space-y-1">
          {availableUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users available</p>
          ) : (
            availableUsers.map((u) => {
              const isSelected = selectedUser?.email === u.email;
              return (
                <button
                  key={u._id}
                  onClick={() => onSelectUser(u)}
                  className={`w-full text-left p-2 rounded ${
                    isSelected
                      ? "bg-blue-200 font-semibold"
                      : "hover:bg-gray-200"
                  }`}
                >
                  {u.avatar || "👤"} {u.name || u.email}
                </button>
              );
            })
          )}
        </div>
      </div>
      <LogoutButton />
    </div>
  );
};

export default Sidebar;
