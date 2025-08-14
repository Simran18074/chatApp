import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // JWT token remove karo
    localStorage.removeItem("token");

    // Navigate to login page
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
