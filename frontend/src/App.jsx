import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Join from "./components/join";
import Chat from "./components/chat";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min"; 
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import { useDispatch } from "react-redux";
import { authActions } from "./store/auth";
import "./App.css";

const socket = io("https://chat-mern-backend.onrender.com/", {
    transports: ["websocket"],
});

const App = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (localStorage.getItem("id") && localStorage.getItem("token")) {
            dispatch(authActions.login());
        }
    }, [dispatch]);

    const [userInfo, setUserInfo] = useState(() => {
        return JSON.parse(localStorage.getItem("userInfo")) || null;
    });

    const [usersInRoom, setUsersInRoom] = useState([]);

    useEffect(() => {
        if (userInfo) {
            socket.emit("joinRoom", userInfo);
        }

        socket.on("updateUsers", (updatedUsers) => {
            setUsersInRoom(updatedUsers);
        });

        return () => {
            socket.off("updateUsers");
        };
    }, [userInfo]);

    const handleJoin = (username, roomId, language) => {
        if (!username || !roomId || !language) return;

        const user = { username, roomId, language };
        setUserInfo(user);
        localStorage.setItem("userInfo", JSON.stringify(user));
        socket.emit("joinRoom", user);
    };

    const handleLeave = () => {
        if (userInfo) {
            socket.emit("leaveRoom", userInfo.roomId);
        }
        setUserInfo(null);
        localStorage.removeItem("userInfo");
    };

    const handleCreateRoom = async () => {
        try {
            const response = await fetch("https://chat-mern-backend.onrender.com/create-room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            const data = await response.json();
            if (data.roomId) {
                // alert(`Room Created! Room ID: ${data.roomId}`);
                return data.roomId;
            } else {
                console.error("Failed to create room.");
                return null;
            }
        } catch (error) {
            console.error("Error creating room:", error);
            return null;
        }
    };

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ✅ Protect Join Route */}
            <Route
                path="/join"
                element={
                    <ProtectedRoute>
                        <Join onJoin={handleJoin} onCreateRoom={handleCreateRoom} />
                    </ProtectedRoute>
                }
            />

            {/* ✅ Protect Chat Route */}
            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        {userInfo ? (
                            <Chat
                                socket={socket}
                                userInfo={userInfo}
                                usersInRoom={usersInRoom}
                                setUsersInRoom={setUsersInRoom}
                                setUserInfo={setUserInfo}
                            />
                        ) : (
                            <Navigate to="/join" /> // ✅ Redirect to Join if user isn't in a chat
                        )}
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default App;
