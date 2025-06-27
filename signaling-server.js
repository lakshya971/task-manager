const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors());

const io = socketIO(server, {
  cors: {
    origin: "*", // In production, specify your frontend URL
    methods: ["GET", "POST"]
  },
});

// Store room information with enhanced data
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (data) => {
    let roomId, user, password;
    
    // Handle both old format (string) and new format (object)
    if (typeof data === 'string') {
      roomId = data;
      user = { id: socket.id, name: `User ${socket.id.slice(-4)}` };
    } else {
      roomId = data.roomId;
      user = data.user;
      password = data.password;
    }

    console.log(`User ${user.name} (${socket.id}) attempting to join room: ${roomId}`);
    
    // Validate room ID
    if (!roomId || roomId.trim() === '') {
      socket.emit('join-error', 'Invalid room ID');
      return;
    }
    
    // Leave any existing rooms
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`User ${socket.id} left room: ${room}`);
      }
    });

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Map(),
        password: password || null,
        createdAt: new Date(),
        isPasswordProtected: !!password
      });
      console.log(`Created new room: ${roomId} ${password ? '(password protected)' : '(public)'}`);
    }

    const room = rooms.get(roomId);
    
    // Check password for private meetings
    if (room.password && room.password !== password) {
      socket.emit('join-error', 'Invalid meeting password');
      console.log(`User ${user.name} failed to join room ${roomId}: Invalid password`);
      return;
    }

    // Join the room
    socket.join(roomId);
    
    // Store user info
    socket.userId = socket.id;
    socket.roomId = roomId;
    socket.userName = user.name;
    
    // Add to room participants
    room.participants.set(socket.id, {
      id: socket.id,
      name: user.name,
      isVideoEnabled: true,
      isAudioEnabled: true,
      joinedAt: new Date()
    });

    // Send success confirmation to the joining user
    socket.emit('join-success', {
      roomId: roomId,
      user: user,
      isPasswordProtected: !!room.password
    });

    // Notify others in the room
    socket.to(roomId).emit('user-joined', { 
      userId: socket.id, 
      user: {
        id: socket.id,
        name: user.name,
        isVideoEnabled: true,
        isAudioEnabled: true,
        joinedAt: new Date()
      }
    });
    
    // Send current room participants to the new user
    const participants = Array.from(room.participants.values()).filter(p => p.id !== socket.id);
    socket.emit('room-participants', participants);
    
    // Send system message to room
    socket.to(roomId).emit('system-message', `${user.name} joined the meeting`);
    
    console.log(`✅ User ${user.name} successfully joined room ${roomId}. Room now has ${room.participants.size} participants`);
  });

  // Enhanced WebRTC signaling with user targeting
  socket.on('offer', ({ roomId, toUserId, offer }) => {
    console.log(`Offer from ${socket.id} to ${toUserId} in room ${roomId}`);
    socket.to(toUserId).emit('offer', { fromUserId: socket.id, offer });
  });

  socket.on('answer', ({ roomId, toUserId, answer }) => {
    console.log(`Answer from ${socket.id} to ${toUserId} in room ${roomId}`);
    socket.to(toUserId).emit('answer', { fromUserId: socket.id, answer });
  });

  socket.on('ice-candidate', ({ roomId, toUserId, candidate }) => {
    console.log(`ICE candidate from ${socket.id} to ${toUserId} in room ${roomId}`);
    socket.to(toUserId).emit('ice-candidate', { fromUserId: socket.id, candidate });
  });

  // Participant status updates
  socket.on('participant-update', ({ roomId, updates }) => {
    const room = rooms.get(roomId);
    if (room && room.participants.has(socket.id)) {
      const participant = room.participants.get(socket.id);
      Object.assign(participant, updates);
      
      // Broadcast update to all other participants
      socket.to(roomId).emit('participant-updated', { userId: socket.id, updates });
    }
  });

  // Chat messages
  socket.on('chat-message', ({ roomId, message }) => {
    console.log(`Chat message in room ${roomId} from ${socket.userName}: ${message.message}`);
    socket.to(roomId).emit('chat-message', message);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.participants.delete(socket.id);
        
        // Notify others in the room
        socket.to(socket.roomId).emit('user-left', { 
          userId: socket.id, 
          userName: socket.userName 
        });
        
        console.log(`${socket.userName} left room ${socket.roomId}`);
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
  });

  // Room management
  socket.on('get-room-info', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.emit('room-info', {
        participantCount: room.participants.size,
        isPasswordProtected: !!room.password,
        createdAt: room.createdAt
      });
    } else {
      socket.emit('room-info', null);
    }
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`✅ Enhanced WebRTC Signaling Server running on port ${PORT}`);
  console.log(`🚀 Ready to handle real-time video meetings!`);
  console.log(`📱 Features: Password protection, Real-time chat, Multi-user support`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Room cleanup interval (cleanup rooms older than 24 hours with no participants)
setInterval(() => {
  const now = new Date();
  rooms.forEach((room, roomId) => {
    if (room.participants.size === 0) {
      const ageHours = (now - room.createdAt) / (1000 * 60 * 60);
      if (ageHours > 24) {
        rooms.delete(roomId);
        console.log(`Cleaned up old empty room: ${roomId}`);
      }
    }
  });
}, 60000); // Run every minute
