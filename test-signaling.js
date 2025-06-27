// Test script for the signaling server
const io = require('socket.io-client');

console.log('🧪 Testing WebRTC Signaling Server...\n');

const socket1 = io('http://localhost:5001');
const socket2 = io('http://localhost:5001');

socket1.on('connect', () => {
  console.log('✅ Client 1 connected:', socket1.id);
  
  // Join a test room
  socket1.emit('join-room', {
    roomId: 'test-room-123',
    user: { id: socket1.id, name: 'Test User 1' }
  });
});

socket2.on('connect', () => {
  console.log('✅ Client 2 connected:', socket2.id);
  
  setTimeout(() => {
    // Join the same test room
    socket2.emit('join-room', {
      roomId: 'test-room-123',
      user: { id: socket2.id, name: 'Test User 2' }
    });
  }, 1000);
});

// Test event listeners
socket1.on('join-success', (data) => {
  console.log('🎉 Client 1 joined successfully:', data);
});

socket1.on('user-joined', (data) => {
  console.log('👥 Client 1 sees user joined:', data.user.name);
});

socket1.on('system-message', (message) => {
  console.log('📨 Client 1 system message:', message);
});

socket2.on('join-success', (data) => {
  console.log('🎉 Client 2 joined successfully:', data);
});

socket2.on('user-joined', (data) => {
  console.log('👥 Client 2 sees user joined:', data.user.name);
});

socket2.on('system-message', (message) => {
  console.log('📨 Client 2 system message:', message);
});

// Test chat
setTimeout(() => {
  console.log('\n💬 Testing chat functionality...');
  socket1.emit('chat-message', {
    roomId: 'test-room-123',
    message: {
      id: Date.now().toString(),
      userId: socket1.id,
      userName: 'Test User 1',
      message: 'Hello from client 1!',
      timestamp: new Date()
    }
  });
}, 2000);

socket2.on('chat-message', (message) => {
  console.log('💬 Client 2 received chat:', message.userName, '-', message.message);
});

// Test participant updates
setTimeout(() => {
  console.log('\n🎥 Testing participant updates...');
  socket1.emit('participant-update', {
    roomId: 'test-room-123',
    updates: { isVideoEnabled: false }
  });
}, 3000);

socket2.on('participant-updated', (data) => {
  console.log('🎥 Client 2 sees participant update:', data.userId, data.updates);
});

// Clean up after tests
setTimeout(() => {
  console.log('\n🧹 Cleaning up test connections...');
  socket1.disconnect();
  socket2.disconnect();
  console.log('✅ Test completed successfully!');
  process.exit(0);
}, 5000);

// Error handling
socket1.on('error', (error) => {
  console.error('❌ Client 1 error:', error);
});

socket2.on('error', (error) => {
  console.error('❌ Client 2 error:', error);
});

socket1.on('join-error', (error) => {
  console.error('❌ Client 1 join error:', error);
});

socket2.on('join-error', (error) => {
  console.error('❌ Client 2 join error:', error);
});
