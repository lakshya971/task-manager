import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Users } from 'lucide-react';

// This will be your signaling server URL
const SIGNALING_SERVER = 'http://localhost:5001';

interface VideoRoomProps {
  taskId?: string;
}

export function VideoRoom({ taskId }: VideoRoomProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);

  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SIGNALING_SERVER);
    setSocket(newSocket);

    // Join room
    const currentRoomId = roomId || taskId || 'default-room';
    newSocket.emit('join-room', currentRoomId);

    // Initialize peer connection
    const pc = new RTCPeerConnection(config);
    setPeerConnection(pc);

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
      });

    // Socket event listeners
    newSocket.on('user-joined', (userId: string) => {
      console.log('User joined:', userId);
      setIsConnected(true);
    });

    newSocket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit('answer', { roomId: currentRoomId, answer });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    newSocket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    newSocket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    // Peer connection event listeners
    pc.onicecandidate = event => {
      if (event.candidate) {
        newSocket.emit('ice-candidate', { 
          roomId: currentRoomId, 
          candidate: event.candidate 
        });
      }
    };

    pc.ontrack = event => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsCallStarted(true);
      }
    };

    return () => {
      // Cleanup
      localStream?.getTracks().forEach(track => track.stop());
      pc.close();
      newSocket.disconnect();
    };
  }, [roomId, taskId]);

  const startCall = async () => {
    if (!peerConnection || !socket) return;
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { 
        roomId: roomId || taskId || 'default-room', 
        offer 
      });
      setIsCallStarted(true);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      
      if (peerConnection && localVideoRef.current) {
        // Replace video track
        const sender = peerConnection.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
        
        localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (localStream && peerConnection && localVideoRef.current) {
      const sender = peerConnection.getSenders().find(s => 
        s.track?.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(localStream.getVideoTracks()[0]);
      }
      
      localVideoRef.current.srcObject = localStream;
      setIsScreenSharing(false);
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnection?.close();
    socket?.disconnect();
    window.close(); // Or navigate back
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-white" />
          <span className="text-white font-medium">
            Task Call - Room: {roomId || taskId || 'default-room'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex">
        {/* Remote Video */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-800"
          />
          {!isCallStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">Waiting for participants...</p>
                <button
                  onClick={startCall}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Start Call
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="w-64 h-48 absolute bottom-20 right-4 bg-gray-700 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isAudioEnabled ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoEnabled ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`p-3 rounded-full ${
            isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
          }`}
        >
          <Monitor className="h-5 w-5" />
        </button>

        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
