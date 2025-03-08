import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem("id") && localStorage.getItem("token"); // ✅ Check if user is logged in

    return isAuthenticated ? children : <Navigate to="/" />; // ✅ Redirect to Login if not logged in
};

export default ProtectedRoute;
