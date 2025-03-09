import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const Join = ({ onJoin, onCreateRoom }) => {
    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");
    const [language, setLanguage] = useState("en");
    const [modalOpen, setModalOpen] = useState(false);
    const [createdRoomId, setCreatedRoomId] = useState(null);
    const navigate = useNavigate();

    // ✅ Check if Room ID Exists in Database
    const validateRoomId = async () => {
        try {
            const response = await fetch("https://chat-mern-backend.onrender.com/check-room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId }),
            });

            const data = await response.json();
            return data.exists; // ✅ Returns true if room exists, false otherwise
        } catch (error) {
            console.error("Error checking room:", error);
            return false;
        }
    };
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("id");
        localStorage.removeItem("role"); // ✅ Remove token
        localStorage.removeItem("userInfo"); // ✅ Remove user info
        navigate("/"); // ✅ Redirect to login page
    };

    // ✅ Join Room if Room ID is Valid
    const handleJoinClick = async () => {
        if (!username.trim() || !roomId.trim()) {
            alert("Please enter a username and Room ID.");
            return;
        }

        const roomExists = await validateRoomId();
        if (roomExists) {
           await onJoin(username, roomId, language);
            navigate("/chat"); // ✅ Redirect to Chat Page
        } else {
            alert("Invalid Room ID! Please enter a valid Room ID.");
        }
    };

    // ✅ Create Room & Autofill Room ID Field
    const handleCreateRoom = async () => {
        const newRoomId = await onCreateRoom();
        if (newRoomId) {
            setCreatedRoomId(newRoomId);
            setRoomId(newRoomId); // ✅ Autofill Room ID input
            console.log("Room: " + newRoomId);
            setModalOpen(true);
        }
    };

    

    return (
        <div className="container">
            <div className="text">Join Chat Room</div>
            <form>
                <div className="form-row">
                    <div className="input-data">
                        <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />
                        <div className="underline"></div>
                        <label>Username</label>
                    </div>
                    <div className="input-data">
                        <input type="text" required value={roomId} onChange={(e) => setRoomId(e.target.value)} />
                        <div className="underline"></div>
                        <label>Room ID</label>
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-data">
                        <select className="select-field" required value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="es">Spanish</option>
                        </select>
                        <div className="underline"></div>
                        <label>Language</label>
                    </div>
                </div>

                <div className="form-row submit-btn">
                    <div className="input-data">
                        <div className="inner"></div>
                        <input type="button" value="Join Room" onClick={handleJoinClick} />
                    </div>
                    <div className="input-data">
                        <div className="inner"></div>
                        <input type="button" value="Create Room" onClick={handleCreateRoom} />
                    </div>
                </div>
            </form>

            <div className="form-row logout-btn">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>

            {modalOpen ? 
                    <div className="modal">
                        <h3>Room Created Successfully 🎉</h3>
                        <p>Room ID: <strong>{createdRoomId}</strong></p>
                        <button className="close-btn" onClick={() => setModalOpen(false)}>Close</button>
                    </div>
             : null}
        </div>
    );
};

export default Join;
