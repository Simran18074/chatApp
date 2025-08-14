import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token || !user) return <Navigate to="/login" />;
  console.log("Checking token in PrivateRoute:", token);

  return children;
};

export default PrivateRoute;
