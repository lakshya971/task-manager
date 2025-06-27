import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  Users, 
  MessageSquare,
  MoreVertical,
  Copy,
  Check,
  Lock,
  Maximize,
  Minimize
} from 'lucide-react';
import { NotificationSystem, useNotifications } from '../ui/NotificationSystem';

const SIGNALING_SERVER = 'http://localhost:5001';

interface Participant {
  id: string;
  name: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Socket and WebRTC states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  // Meeting states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // UI states
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [meetingStartTime] = useState(new Date());
  const [duration, setDuration] = useState('00:00');
  const [isPasswordProtected] = useState(!!searchParams.get('password'));
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeaderInFullscreen, setShowHeaderInFullscreen] = useState(true);
  
  // User info
  const [currentUser] = useState({
    id: localStorage.getItem('meetingUserId') || Date.now().toString(),
    name: localStorage.getItem('meetingUserName') || 'Anonymous User'
  });

  // Notification system
  const { notifications, removeNotification, showInfo, showWarning, showSuccess } = useNotifications();

  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize meeting
  useEffect(() => {
    if (!roomId) return;

    initializeConnection();
    
    return () => {
      cleanup();
    };
  }, [roomId]);

  // Duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(getMeetingDuration());
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingStartTime]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (isFS) {
        // Auto-hide header after 3 seconds in fullscreen
        const timer = setTimeout(() => {
          setShowHeaderInFullscreen(false);
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setShowHeaderInFullscreen(true);
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === 'Escape' && document.fullscreenElement) {
        event.preventDefault();
        document.exitFullscreen();
      }
    };

    const handleMouseMove = () => {
      if (isFullscreen) {
        setShowHeaderInFullscreen(true);
        // Hide again after 3 seconds of no movement
        const timer = setTimeout(() => {
          setShowHeaderInFullscreen(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isFullscreen]);

  const initializeConnection = async () => {
    try {
      // Initialize socket connection
      const newSocket = io(SIGNALING_SERVER);
      setSocket(newSocket);

      // Get user media first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join room with user info
      newSocket.emit('join-room', {
        roomId,
        user: currentUser,
        password: searchParams.get('password')
      });

      // Socket event listeners
      setupSocketListeners(newSocket, stream);

    } catch (error) {
      console.error('Error initializing connection:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const setupSocketListeners = (newSocket: Socket, stream: MediaStream) => {
    // Join success
    newSocket.on('join-success', ({ roomId: joinedRoomId }) => {
      console.log('Successfully joined room:', joinedRoomId);
      addSystemMessage(`You joined the meeting`);
      showSuccess('Connected', 'Successfully joined the meeting room');
      setConnectionStatus('connected');
    });

    // Join error
    newSocket.on('join-error', (error: string) => {
      console.error('Failed to join room:', error);
      alert(`Failed to join meeting: ${error}`);
      setConnectionStatus('disconnected');
      navigate('/meetings');
    });

    // System messages
    newSocket.on('system-message', (message: string) => {
      addSystemMessage(message);
    });

    // User joined
    newSocket.on('user-joined', ({ userId, user }: { userId: string; user: any }) => {
      console.log('User joined:', user.name);
      addParticipant(userId, user);
      createPeerConnection(userId, newSocket, stream, true);
      
      // Add system message and notification
      addSystemMessage(`${user.name} joined the meeting`);
      showInfo('Participant Joined', `${user.name} has joined the meeting`);
    });

    // User left
    newSocket.on('user-left', ({ userId, userName }: { userId: string; userName: string }) => {
      console.log('User left:', userName);
      removeParticipant(userId);
      
      // Clean up peer connection
      const pc = peerConnections.get(userId);
      if (pc) {
        pc.close();
        setPeerConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }
      
      addSystemMessage(`${userName} left the meeting`);
      showWarning('Participant Left', `${userName} has left the meeting`);
    });

    // WebRTC signaling
    newSocket.on('offer', async ({ fromUserId, offer }: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      const pc = await createPeerConnection(fromUserId, newSocket, stream, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit('answer', { roomId, toUserId: fromUserId, answer });
    });

    newSocket.on('answer', async ({ fromUserId, answer }: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.get(fromUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    newSocket.on('ice-candidate', async ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.get(fromUserId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Participant updates
    newSocket.on('participant-updated', ({ userId, updates }: { userId: string; updates: any }) => {
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, ...updates } : p
      ));
    });

    // Chat messages
    newSocket.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Room info
    newSocket.on('room-participants', (roomParticipants: any[]) => {
      setParticipants(roomParticipants.filter(p => p.id !== currentUser.id));
      // Create peer connections for existing participants
      roomParticipants.forEach(participant => {
        if (participant.id !== currentUser.id) {
          createPeerConnection(participant.id, newSocket, stream, true);
        }
      });
    });

    // Error handling
    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
      alert(error);
    });
  };

  const createPeerConnection = async (userId: string, socket: Socket, stream: MediaStream, isInitiator: boolean): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(config);
    
    // Add local stream
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', userId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, event.streams[0]);
        return newMap;
      });
      
      // Set first remote stream to main video
      if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          roomId,
          toUserId: userId,
          candidate: event.candidate
        });
      }
    };

    // Store peer connection
    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, pc);
      return newMap;
    });

    // If initiator, create offer
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, toUserId: userId, offer });
    }

    return pc;
  };

  const addParticipant = (userId: string, user: any) => {
    setParticipants(prev => {
      if (prev.find(p => p.id === userId)) return prev;
      return [...prev, {
        id: userId,
        name: user.name,
        isVideoEnabled: true,
        isAudioEnabled: true,
        joinedAt: new Date()
      }];
    });
  };

  const removeParticipant = (userId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== userId));
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  };

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'system',
      userName: 'System',
      message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, systemMessage]);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Broadcast update
        socket?.emit('participant-update', {
          roomId,
          updates: { isVideoEnabled: videoTrack.enabled }
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        // Broadcast update
        socket?.emit('participant-update', {
          roomId,
          updates: { isAudioEnabled: audioTrack.enabled }
        });
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
        
        // Replace video track in all peer connections
        peerConnections.forEach(async (pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });
        
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      setIsScreenSharing(false);
      
      // Replace back to camera in all peer connections
      peerConnections.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(localStream.getVideoTracks()[0]);
        }
      });
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !socket) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      message: newMessage.trim(),
      timestamp: new Date()
    };
    
    socket.emit('chat-message', { roomId, message });
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const copyMeetingLink = async () => {
    const meetingLink = `${window.location.origin}/meeting-room/${roomId}${isPasswordProtected ? `?password=${searchParams.get('password')}` : ''}`;
    try {
      await navigator.clipboard.writeText(meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const endMeeting = () => {
    cleanup();
    navigate('/meetings');
  };

  const cleanup = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnections.forEach(pc => pc.close());
    socket?.disconnect();
  };

  const getMeetingDuration = () => {
    const now = new Date();
    const duration = Math.floor((now.getTime() - meetingStartTime.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await document.documentElement.requestFullscreen();
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Header */}
      <div className={`bg-gray-800 p-4 flex items-center justify-between transition-transform duration-300 ${
        isFullscreen && !showHeaderInFullscreen 
          ? '-translate-y-full opacity-0' 
          : 'translate-y-0 opacity-100'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-white font-medium">
              {connectionStatus === 'connected' ? 'Meeting Room' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
            {isPasswordProtected && <Lock className="h-4 w-4 text-yellow-500" />}
          </div>
          <div className="text-gray-300 text-sm">
            Duration: {duration}
          </div>
          <div className="text-gray-300 text-sm">
            Room: {roomId}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={copyMeetingLink}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            {linkCopied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>{participants.length + 1}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 relative">
            {/* Main Video Area */}
            <div className="w-full h-full relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-gray-800"
              />
            </div>
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {currentUser.name} (You)
              </div>
            </div>

            {/* Screen Share Indicator */}
            {isScreenSharing && (
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
                You're sharing your screen
              </div>
            )}

            {/* Fullscreen Indicator */}
            {isFullscreen && (
              <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-2">
                <Maximize className="h-4 w-4" />
                <span>Fullscreen Mode</span>
                <span className="text-xs opacity-75">(Press F11 or Esc to exit)</span>
              </div>
            )}

            {/* No participants message */}
            {participants.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Waiting for participants...</p>
                  <p className="text-sm text-gray-400">Share the meeting link to invite others</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className={`bg-gray-800 p-4 transition-transform duration-300 ${
            isFullscreen && !showHeaderInFullscreen 
              ? 'translate-y-full opacity-0' 
              : 'translate-y-0 opacity-100'
          }`}>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  isAudioEnabled 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                title={isAudioEnabled ? 'Mute' : 'Unmute'}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoEnabled 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>

              <button
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  isScreenSharing 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <Monitor className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-3 rounded-full transition-colors ${
                  showChat
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                title="Chat"
              >
                <MessageSquare className="h-5 w-5" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>

              <button
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                title="More options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              <button
                onClick={endMeeting}
                className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
                title="End meeting"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        {(showParticipants || showChat) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setShowParticipants(true)}
                className={`flex-1 p-3 text-sm font-medium ${
                  showParticipants && !showChat
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Participants ({participants.length + 1})
              </button>
              <button
                onClick={() => setShowChat(true)}
                className={`flex-1 p-3 text-sm font-medium ${
                  showChat
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
              </button>
            </div>

            {/* Participants Panel */}
            {showParticipants && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {/* Current User */}
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{currentUser.name} (You)</p>
                    </div>
                    <div className="flex space-x-1">
                      <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className={`w-2 h-2 rounded-full ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>

                  {/* Other Participants */}
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{participant.name}</p>
                        <p className="text-gray-400 text-xs">
                          Joined {participant.joinedAt.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <div className={`w-2 h-2 rounded-full ${participant.isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${participant.isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Panel */}
            {showChat && (
              <div className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`${
                      message.userId === 'system' 
                        ? 'text-center text-gray-400 text-sm'
                        : message.userId === currentUser.id
                          ? 'text-right'
                          : 'text-left'
                    }`}>
                      {message.userId === 'system' ? (
                        <p>{message.message}</p>
                      ) : (
                        <div className={`inline-block max-w-xs p-2 rounded-lg ${
                          message.userId === currentUser.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}>
                          <p className="text-xs opacity-75 mb-1">{message.userName}</p>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-50 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
