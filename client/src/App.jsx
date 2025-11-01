import React, { useState, useEffect, useRef } from "react";
import socket from "./socket/socket";

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]); // 🟢 new state

  const typingTimeout = useRef(null);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("user_typing", (data) => {
      setTypingUser(data.sender);
    });

    socket.on("user_stop_typing", () => {
      setTypingUser("");
    });

    socket.on("update_user_list", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("update_user_list");
    };
  }, []);

  const joinRoom = () => {
    if (username.trim() && room.trim()) {
      socket.emit("join_room", { username, room });
      setIsJoined(true);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const data = {
      room,
      sender: username,
      message,
      time: new Date().toLocaleTimeString(),
    };
    socket.emit("send_message", data);
    setMessage("");
    socket.emit("stop_typing", { room });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    socket.emit("typing", { room, sender: username });

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { room });
    }, 1000);
  };

  if (!isJoined) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Join a Chat Room</h2>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "0.5rem", marginBottom: "10px" }}
        />
        <br />
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{ padding: "0.5rem", marginBottom: "10px" }}
        >
          <option value="">Select a Room</option>
          <option value="general">General</option>
          <option value="tech">Tech</option>
          <option value="random">Random</option>
        </select>
        <br />
        <button
          onClick={joinRoom}
          style={{
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#28a745",
            color: "white",
          }}
        >
          Join
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "50px auto" }}>
      <h2 style={{ textAlign: "center" }}>Room: {room}</h2>

      {/* 🟢 Online Users */}
      <div
        style={{
          marginBottom: "10px",
          background: "#f0f0f0",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <strong>Online:</strong>{" "}
        {onlineUsers.length > 0 ? onlineUsers.join(", ") : "No one online"}
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "1rem",
          height: "300px",
          overflowY: "auto",
          marginBottom: "1rem",
        }}
      >
        {chat.map((msg, i) => (
          <p key={i}>
            <strong>{msg.sender}:</strong> {msg.message}{" "}
            <em style={{ fontSize: "0.8em" }}>({msg.time})</em>
          </p>
        ))}
        {typingUser && (
          <p style={{ fontStyle: "italic", color: "#666" }}>
            {typingUser} is typing...
          </p>
        )}
      </div>

      <input
        type="text"
        placeholder="Type message..."
        value={message}
        onChange={handleTyping}
        style={{
          width: "70%",
          padding: "0.5rem",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
      <button
        onClick={sendMessage}
        style={{
          marginLeft: "10px",
          padding: "0.5rem 1rem",
          borderRadius: "5px",
          border: "none",
          background: "#007bff",
          color: "white",
        }}
      >
        Send
      </button>
    </div>
  );
}

export default App;
