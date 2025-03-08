import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Chat = ({ socket, userInfo, usersInRoom, setUsersInRoom, setUserInfo }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    if (!userInfo || !userInfo.roomId) return;

    socket.emit("joinRoom", userInfo);
    socket.emit("requestUsers", userInfo.roomId);

    // Remove any previous listeners before adding new ones
    socket.off("updateUsers");
    socket.on("updateUsers", (updatedUsers) => {
      console.log("🔄 Users updated:", updatedUsers);
      setUsersInRoom(updatedUsers);
    });

    return () => {
      socket.off("updateUsers");
    };
  }, [socket, userInfo, setUsersInRoom]);

 useEffect(() => {
        if (!userInfo.roomId) return;

        socket.off("loadMessages");
        socket.off("receiveMessage");

        socket.emit("requestMessages", userInfo.roomId);

        socket.on("loadMessages", (loadedMessages) => {
            console.log("📩 Loaded messages:", loadedMessages);
            const processedMessages = loadedMessages.map(msg => {
                if (msg.translations && msg.translations[userInfo.language]) {
                    return { ...msg, message: msg.translations[userInfo.language]};
                }
                return msg;
            });
            setMessages(processedMessages);
        });

        socket.on("receiveMessage", (data) => {
            console.log("📥 New message received:", data);
            setMessages((prev) => {
                if (!prev.some((msg) => msg.message === data.message && msg.username === data.username)) {
                    if (data.translations && data.translations[userInfo.language]) {
                        return [...prev, {...data, message: data.translations[userInfo.language]}];
                    }
                    return [...prev, data];
                }
                return prev;
            });
        });

        return () => {
            socket.off("loadMessages");
            socket.off("receiveMessage");
        };
    }, [socket, userInfo.roomId, userInfo.language]); //add userInfo.language to the useEffect dependency array.

    const downloadFile = (url, filename) => {
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch((error) => console.error("❌ Error downloading file:", error));
    };
  
    const getFileExtension = (fileType) => {
      if (fileType === "image") return "jpg"; // Default for images
      if (fileType === "video") return "mp4"; // Default for videos
      if (fileType === "audio") return "mp3"; // Default for audio
      if (fileType === "file") return "txt"; // Default for files, change accordingly
      return "bin"; // Default for unknown types
    };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sender", userInfo.username);
      formData.append("roomId", userInfo.roomId);
  
      let fileType = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : file.type.startsWith("audio")
        ? "audio"
        : "file";
      formData.append("type", fileType);
  
      try {
        const res = await axios.post("http://localhost:5000/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
  
        const fileUrl = res.data.url || res.data.secure_url;
        if (!fileUrl) {
          console.error("❌ No file URL returned from backend!", res.data);
          return;
        }
  
        const fileMessage = {
          username: userInfo.username,
          message: fileUrl,
          type: fileType,
          roomId: userInfo.roomId,
        };
  
        socket.emit("sendMessage", fileMessage);
        setMessages((prev) => [...prev, fileMessage]); // 🔥 Show message immediately
      } catch (error) {
        console.error("❌ Error sending file:", error);
      }
  
      setFile(null);
    } else if (message.trim()) {
      const textMessage = {
        username: userInfo.username,
        message: message.trim(),
        type: "text",
        roomId: userInfo.roomId,
      };
  
      socket.emit("sendMessage", textMessage);
      setMessages((prev) => [...prev, textMessage]); // 🔥 Show message immediately
      setMessage("");
    }
  };
  

  const leaveRoom = () => {
    socket.emit("leaveRoom", userInfo.roomId);
    setUserInfo(null);
    setUsersInRoom([]);
    localStorage.removeItem("userInfo");
    navigate("/join");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat Room: {userInfo.roomId}</h2>
        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="user-list">
        <h3>Users in Room:</h3>
        {usersInRoom.length === 0 ? (
          <p>No users in the room</p>
        ) : (
          <ul>
            {usersInRoom.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="chat-box">
        {messages.length === 0 ? (
          <p className="no-messages">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.username === userInfo.username ? "sent" : "received"}`}>
              <span className="message-username">{msg.username}</span>
              {msg.type === "image" ? (
                <>
                  <img src={msg.message} alt="Sent Image" className="message-image" />
                  <button onClick={() => downloadFile(msg.message, `image-${index}.jpg`)}>📥 Download</button>
                </>
              ) : msg.type === "video" ? (
                <>
                  <video controls className="message-video">
                    <source src={msg.message} type="video/mp4" />
                  </video>
                  <button onClick={() => downloadFile(msg.message, `video-${index}.mp4`)}>📥 Download</button>
                </>
              ) : msg.type === "audio" ? (
                <>
                  <audio controls className="message-audio">
                    <source src={msg.message} type="audio/mpeg" />
                  </audio>
                  <button onClick={() => downloadFile(msg.message, `audio-${index}.mp3`)}>📥 Download</button>
                </>
              ) : (
                <p className="message-text">{msg.message}</p>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="send-button" onClick={sendMessage}>Send</button>
        <input type="file" accept="image/*,video/*,audio/*" onChange={handleFileChange} />
      </div>
    </div>
  );
};

export default Chat;
