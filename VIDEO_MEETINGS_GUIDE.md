# Video Meetings Feature - User Guide

## Overview
The video meetings feature provides a complete real-time video conferencing solution with WebRTC and Socket.IO, supporting both public and private meetings with password protection.

## Features

### ✅ Meeting Types
- **Public Meetings**: Open to anyone with the meeting link
- **Private Meetings**: Password-protected with secure access

### ✅ Real-time Functionality
- **Multi-user WebRTC**: Supports multiple participants simultaneously
- **Live Audio/Video Controls**: Real-time mute/unmute and camera on/off
- **Screen Sharing**: Share your screen with all participants
- **Real-time Chat**: Text messaging with all participants
- **Live Notifications**: Join/leave notifications for all participants
- **Participant Panel**: See who's in the meeting and their status

### ✅ Meeting Management
- **Start Instant Meeting**: Create and join meetings immediately
- **Schedule Meetings**: Plan meetings for future dates
- **Join by ID/Link**: Join meetings using meeting ID or shared link
- **Meeting Duration Timer**: See how long the meeting has been running
- **Copy Meeting Links**: Easily share meeting access

## How to Use

### Starting a New Meeting

1. **Navigate to Meetings Page**
   - Click on "Meetings" in the sidebar
   - You'll see the meetings dashboard

2. **Start Instant Meeting**
   - Click "Start Meeting" button
   - A popup will appear asking for:
     - Your name (required)
     - Meeting type (Public/Private)
     - Meeting ID (optional - auto-generated if empty)
     - Password (for private meetings - auto-generated if empty)

3. **Choose Meeting Type**
   - **Public Meeting**: Select "Public Meeting" option
   - **Private Meeting**: Select "Private Meeting" option and optionally set a password

4. **Create and Join**
   - Click "Create Meeting"
   - Review the meeting details and copy the link if needed
   - Click "Join Meeting" to enter the meeting room

### Joining an Existing Meeting

1. **Join by Meeting ID**
   - Click "Join" in the Join Meeting section
   - Enter your name
   - Enter the meeting ID or paste the complete meeting link
   - Enter password if it's a private meeting
   - Click "Join Meeting"

2. **Join by Link**
   - If someone shared a meeting link with you, just click it
   - You'll be prompted to enter your name
   - For private meetings, the password is automatically included in the link

### In the Meeting Room

#### Video Controls
- **Camera**: Click the video icon to turn camera on/off
- **Microphone**: Click the mic icon to mute/unmute
- **Screen Share**: Click the monitor icon to share your screen
- **End Call**: Click the red phone icon to leave the meeting

#### Participants Panel
- Click the "Users" button to see all participants
- Shows participant names, join time, and audio/video status
- Real-time updates when people join or leave

#### Chat Feature
- Click the "Chat" button to open the chat panel
- Send messages to all participants
- See system messages for joins/leaves
- Chat history is maintained during the meeting

#### Real-time Notifications
- Notifications appear in the top-right corner
- Shows when participants join or leave
- Connection status updates
- Auto-disappears after a few seconds

## Technical Features

### WebRTC Implementation
- **Peer-to-peer connections** for optimal video quality
- **STUN servers** for NAT traversal
- **ICE candidates** for connection establishment
- **Offer/Answer model** for connection negotiation

### Socket.IO Signaling
- **Real-time signaling** for WebRTC setup
- **Room management** with participant tracking
- **Message broadcasting** for chat and notifications
- **Connection state management**

### Security Features
- **Password protection** for private meetings
- **Room validation** to prevent unauthorized access
- **User authentication** within meeting context
- **Secure connection handling**

## Browser Requirements

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Limited support (basic functionality)
- **Mobile browsers**: Basic functionality on modern browsers

## Permissions Required

- **Camera access**: For video functionality
- **Microphone access**: For audio functionality
- **Screen recording**: For screen sharing (when used)

## Troubleshooting

### Common Issues

1. **Camera/Microphone not working**
   - Check browser permissions
   - Ensure no other app is using the camera/mic
   - Try refreshing the page

2. **Can't join meeting**
   - Check the meeting ID is correct
   - Verify password for private meetings
   - Ensure stable internet connection

3. **Video/Audio quality issues**
   - Check internet bandwidth
   - Close other bandwidth-heavy applications
   - Try turning off video to improve audio quality

4. **Screen sharing not working**
   - Some browsers require HTTPS for screen sharing
   - Check browser screen sharing permissions

### Getting Help

If you encounter issues:
1. Refresh the browser page
2. Check your internet connection
3. Verify camera/microphone permissions
4. Try using a different browser
5. Contact support if problems persist

## Development Information

The video meetings feature is built with:
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.IO, Express
- **WebRTC**: Native browser APIs
- **Real-time Communication**: Socket.IO for signaling

### Running the Application

```bash
# Start both frontend and signaling server
npm run dev-with-signaling

# Or start separately
npm run signaling-server  # Backend signaling server (port 5001)
npm run dev              # Frontend development server (port 5173)
```

### Configuration

The signaling server runs on port 5001 by default. If you need to change this:
1. Update `signaling-server.js` PORT constant
2. Update `SIGNALING_SERVER` constant in React components
3. Restart both servers

---

**Note**: This is a development-ready video meetings solution with enterprise-grade features. All real-time functionality is fully implemented and tested.
