# WebRTC Video Calling Integration

This task management app now includes real-time video calling functionality using WebRTC technology.

## 🚀 Features Added

- **1-on-1 Video Calls**: Click the "Call" button on any task card to start a video call
- **Screen Sharing**: Share your screen during calls for better collaboration
- **Audio/Video Toggle**: Control your microphone and camera during calls
- **Task-Specific Rooms**: Each task has its own video call room

## 🛠️ Technology Stack

- **WebRTC**: For peer-to-peer video/audio communication
- **Socket.IO**: For signaling server (connection setup)
- **React**: Frontend video call interface
- **Node.js/Express**: Signaling server backend

## 📋 Setup Instructions

### 1. Install Dependencies
All dependencies are already installed. If you need to reinstall:
```bash
npm install
```

### 2. Start the Application
To run both the frontend and signaling server:
```bash
npm run dev-with-signaling
```

Or run them separately:
```bash
# Terminal 1 - Signaling Server
npm run signaling-server

# Terminal 2 - Frontend
npm run dev
```

### 3. Using Video Calls

1. **Start a Call**: Click the "Call" button (video icon) on any task card
2. **Join a Call**: Others can click the same task's "Call" button to join
3. **Controls Available**:
   - 🎤 Toggle microphone on/off
   - 📹 Toggle camera on/off
   - 🖥️ Start/stop screen sharing
   - ☎️ End call

## 🌐 How It Works

1. **Signaling Server**: Runs on `http://localhost:5000`
   - Handles WebRTC offer/answer exchange
   - Manages room connections
   - Routes ICE candidates between peers

2. **Frontend**: 
   - `VideoRoom` component handles the video call interface
   - Each task gets its own room ID
   - Uses STUN servers for NAT traversal

3. **Task Integration**:
   - Video call button added to each `TaskCard`
   - Routes to `/video-call/:taskId`
   - Multiple people can join the same task call

## 🔧 Configuration

### STUN/TURN Servers
Currently using free Google STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production, consider:
- Setting up your own TURN server (coturn)
- Using services like Twilio TURN
- Configuring additional STUN servers

### Security Considerations

For production deployment:
1. **HTTPS Required**: WebRTC requires secure contexts
2. **CORS Configuration**: Update signaling server CORS settings
3. **Room Authentication**: Add user verification for joining rooms
4. **Rate Limiting**: Implement connection limits

## 🚨 Browser Compatibility

- ✅ Chrome/Chromium (Recommended)
- ✅ Firefox
- ✅ Safari (iOS 11+)
- ✅ Edge
- ❌ Internet Explorer (Not supported)

## 🔍 Troubleshooting

### Common Issues:

1. **Camera/Microphone Not Working**:
   - Check browser permissions
   - Ensure HTTPS in production
   - Try refreshing the page

2. **Connection Failed**:
   - Verify signaling server is running on port 5000
   - Check firewall settings
   - Try different STUN servers

3. **No Video/Audio**:
   - Check if media devices are available
   - Verify WebRTC is supported in browser
   - Check console for error messages

### Debug Mode:
Check browser console for WebRTC logs and connection states.

## 🔮 Future Enhancements

- **Group Calls**: Support for multiple participants
- **Call Recording**: Save important meetings
- **Chat Integration**: Text chat during video calls
- **Calendar Integration**: Schedule calls in advance
- **Mobile App**: React Native implementation

## 📚 Technical Details

### WebRTC Flow:
1. User A clicks "Call" → Creates offer
2. Signaling server relays offer to User B
3. User B creates answer → Sent back via signaling
4. ICE candidates exchanged for connectivity
5. Direct peer-to-peer connection established
6. Video/audio streams transmitted directly

### File Structure:
```
task-manager/
├── signaling-server.js          # WebRTC signaling server
├── src/
│   └── components/
│       └── VideoCall/
│           └── VideoRoom.tsx    # Main video call component
└── package.json                 # Updated with new scripts
```

---

**Need Help?** Check the browser console for detailed WebRTC logs and connection information.
