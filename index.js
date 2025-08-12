const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "chatio-server-production.up.railway.app",
    methods: ["GET", "POST"]
  }
});

// Track active users
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('🟢 New user connected:', socket.id);

  socket.on('join-room', ({ roomId, username }) => {
    if (!roomId || !username) {
      console.error('Invalid join-room request');
      return;
    }

    // Leave any previous rooms
    const currentRooms = Array.from(socket.rooms);
    if (currentRooms.length > 1) {
      socket.leave(currentRooms[1]);
    }

    // Join new room
    socket.join(roomId);
    activeUsers.set(socket.id, { username, roomId });
    
    console.log(`📥 ${username} joined room: ${roomId}`);
    socket.to(roomId).emit('user-joined', { username });
    io.to(roomId).emit('active-users', {
      count: io.sockets.adapter.rooms.get(roomId)?.size || 0,
      users: Array.from(activeUsers.values())
        .filter(user => user.roomId === roomId)
        .map(user => user.username)
    });
  });

  socket.on('chat-message', ({ roomId, message, sender }) => {
    io.to(roomId).emit('chat-message', {
      message,
      sender,
      timestamp: new Date()
    });
  });

  socket.on('typing', ({ roomId, sender }) => {
    socket.to(roomId).emit('typing', { sender });
  });

  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    if (userData) {https://chatio-backend-production.up.railway.app
      const { username, roomId } = userData;
      console.log(`🔴 ${username} disconnected from room: ${roomId}`);
      activeUsers.delete(socket.id);
      io.to(roomId).emit('user-left', { username });
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});



// Serve static frontend files (for testing)
app.use(express.static(path.join(__dirname, 'public')));