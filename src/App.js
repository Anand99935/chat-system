import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import axios from "axios";

// import AdminPanel from "./components/adminpanel";

const socket = io(process.env.REACT_APP_API_URL);

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  // Scroll to bottom on new message
  useEffect(() => {
     axios.get(`${process.env.REACT_APP_API_URL}/messages`)
    const chatBox = document.querySelector(".chat-box");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [chat]);

  // Auto-login if user is saved in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("chatUser");
    if (stored) {
      const user = JSON.parse(stored);
      setName(user.name);
      setEmail(user.email);
      setLoggedIn(true);
    }
  }, []);

  // Load previous messages and listen for new ones
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/messages`)
      .then((res) => res.json())
      .then((data) => setChat(data));

    socket.on("receive-message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  const handleLogin = async () => {
    if (name.trim() && email.trim()) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem("chatUser", JSON.stringify(data.user));
          setLoggedIn(true);
        } else {
          alert("Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Server error while logging in");
      }
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send-message", {
        sender: name,
        text: message,
      });
      setMessage("");
    }
  };

  // Show login form if not logged in
  if (!loggedIn) {
    return (
      <div className="login-container">
        <h2>Login to Chat</h2>
        <input
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleLogin}>Join Chat</button>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <header>💬 Team Chat</header>
      <div className="chat-box">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`chat-bubble ${msg.sender === name ? "you" : "other"}`}
          >
            <div className="sender">{msg.sender}</div>
            <div className="text">{msg.text}</div>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
        <div>
    <span>{name}</span>
    <button className="logout-btn" onClick={() => {
      localStorage.removeItem("chatUser");
      setLoggedIn(false);
      setName("");
      setEmail("");
    }}>Logout</button>
  </div>
    </div>
  );
}

export default App;


