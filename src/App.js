import './App.css';
import React, {useEffect, useState} from 'react';
import {io} from 'socket.io-client';

const socket =
    io(process.env.REACT_APP_API_URL,
       {transports: ['websocket'], withCredentials: true});



function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Scroll to bottom on new message
  useEffect(() => {
    const chatBox = document.querySelector('.chat-box');
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [chat]);

  // Auto-login if user is saved in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chatUser');
    if (stored) {
      const user = JSON.parse(stored);
      setName(user.name);
      setEmail(user.email);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  if (loggedIn && isAdmin) {
    fetch(`${process.env.REACT_APP_API_URL}/api/users`)
      .then(res => res.json())
      .then(data => {
        console.log('Users fetched:', data); // <-- Debug line
        setUsers(data.filter(u => u.name !== 'Admin'));
      })
      .catch(err => console.error('Error fetching users:', err));
  }
}, [loggedIn]);

  // Load previous messages and listen for new ones
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/messages`)
        .then((res) => res.json())
        .then((data) => setChat(data));

    socket.on('receive-message', (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, []);

  //login concept handler user 48-
  const handleLogin = async () => {
  if (name.trim() && email.trim()) {
    // 🧠 Automatically detect admin
    const isAdminLogin = name === 'Admin' && email === 'admin@chat.com';

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, isAdmin: isAdminLogin }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error('Login failed');
      }
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('chatUser', JSON.stringify(data.user));
        localStorage.setItem('isAdmin', isAdminLogin ? 'true' : 'false');
        setLoggedIn(true);
        // Optional: redirect
        // if (isAdminLogin) navigate('/admin');
        // else navigate('/chat');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Server error while logging in');
    }
  } else {
    alert('Please enter both name and email');
  }
};


  //login concept handler admin 78-
//  const handleAdminLogin = async () => {
//   if (name.trim() && email.trim()) {
//     try {
//       const res = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name, email, isAdmin: true }),
//       });
//       if (!res.ok) {
//         const errorText = await res.text();
//         console.error('Server error response:', errorText);
//         throw new Error('Login failed (non-JSON response)');
//       }
//       const data = await res.json();

//       if (data.success && data.isAdmin) {
//         // Save admin to localStorage
//         localStorage.setItem('chatUser', JSON.stringify(data.user));
//         localStorage.setItem('isAdmin', 'true');

//         // Optional: Redirect or set logged in state
//         setLoggedIn(true); // if you're using a state
//         // navigate('/admin/dashboard'); // if using react-router
//       } else {
//         alert('Invalid admin credentials');
//       }

//     } catch (err) {
//       console.error('Admin login error:', err);
//       alert('Server error while logging in as admin');
//     }
//   } else {
//     alert('Please enter valid name and email');
//   }
// };


  const sendMessage = () => {
  if (message.trim()) {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const receiver = isAdmin && selectedUser ? selectedUser.name : 'Admin';
    
    socket.emit('send-message', {
      sender: name,
      text: message,
      receiver
    });

    setMessage('');
  }
};


  // Show login form if not logged in
  if (!loggedIn) {
    return (
      <div className='login-container'>
        <h2>Login to Chat</h2>
        <input
  type="text"
  value={name}
  placeholder="Enter name"
  onChange={(e) => setName(e.target.value)}
/>
<input
  type="email"
  value={email}
  placeholder="Enter email"
  onChange={(e) => setEmail(e.target.value)}
/>
<button onClick={handleLogin}>Login</button>

      </div>
    );
  }
const isAdmin = localStorage.getItem('isAdmin') === 'true';
if (loggedIn && isAdmin && !selectedUser) {
  return (
    <div className="admin-users-list">
      <h2>Admin Panel</h2>
      <h3>Users</h3>
      <ul>
        {users.map((user, idx) => (
          <li key={idx}>
            <button onClick={() => setSelectedUser(user)}>
              {user.name} ({user.email})
            </button>
          </li>
        ))}
      </ul>
      <button className='logout-btn' onClick={() => {
        localStorage.removeItem('chatUser');
        localStorage.removeItem('isAdmin');
        setLoggedIn(false);
        setName('');
        setEmail('');
      }}>Logout</button>
    </div>
  );
}

 return (
  <div className="chat-container">
    <header>
      💬 The Chat
      {isAdmin && selectedUser && (
        <span style={{marginLeft: 20}}>Chatting with: {selectedUser.name}</span>
      )}
    </header>
    <div className='chat-box'>
      {chat
        .filter(msg => {
          if (!isAdmin) return true;
          // Admin: show only messages with selected user
          return (
            (msg.sender === name && msg.receiver === selectedUser?.name) ||
            (msg.sender === selectedUser?.name && msg.receiver === name)
          );
        })
        .map((msg, index) => (
          <div
            key={index}
            className={`chat-bubble ${msg.sender === name ? 'you' : 'other'}`}
          >
            <div className='sender'>{msg.sender}</div>
            <div className="text">{msg.text}</div>
          </div>
        ))}
    </div>
    <div className='input-area'>
      <input
        placeholder='Type your message...'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
    <div>
      <span>{name}</span>
      <button className='logout-btn' onClick={() => {
        localStorage.removeItem('chatUser');
        localStorage.removeItem('isAdmin');
        setLoggedIn(false);
        setName('');
        setEmail('');
      }}>Logout</button>
    </div>
  </div>
);
}

export default App;


