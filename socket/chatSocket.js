const { Server } = require('socket.io');

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: 'https://chatio-server-production.up.railway.app', // Vite dev server
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('🟢 New user connected:', socket.id);

        // Join a specific room
        socket.on('join-room', ({ roomId, username }) => {
            socket.join(roomId);
             if (socket.rooms.has(roomId)) {
        return; // Already joined, prevent duplicate emit
    }
            console.log(`📥 ${username} joined room: ${roomId}`);
            socket.to(roomId).emit('user-joined', { username });
        });

        // Chat message
        socket.on('chat-message', ({ roomId, message, sender }) => {
            io.to(roomId).emit('chat-message', {
                message,
                sender,
                timestamp: new Date(),
            });
        });

        // Typing indicator
        socket.on('typing', ({ roomId, sender }) => {
            socket.to(roomId).emit('typing', { sender });
        });

        socket.on('disconnect', () => {
            console.log('🔴 User disconnected:', socket.id);
        });
    });
}

module.exports = { setupSocket };
