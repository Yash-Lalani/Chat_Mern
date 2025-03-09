import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!(localStorage.getItem("id") && localStorage.getItem("token")); // ✅ Ensure it returns a boolean

    return isAuthenticated ? children : <Navigate to="/" replace />; // ✅ Redirect if not logged in
};

export default ProtectedRoute;
