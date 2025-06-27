import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Lock, 
  X,
  Users,
  AlertCircle
} from 'lucide-react';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeetingId?: string;
}

export function JoinMeetingModal({ isOpen, onClose, initialMeetingId = '' }: JoinMeetingModalProps) {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState(initialMeetingId);
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinMeeting = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!meetingId.trim()) {
      setError('Please enter a meeting ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Store user info in localStorage for the meeting
      localStorage.setItem('meetingUserName', userName);
      localStorage.setItem('meetingUserId', Date.now().toString());
      
      // Check if this is a URL or just meeting ID
      let finalMeetingId = meetingId.trim();
      let finalPassword = password;
      
      // If it's a full URL, extract meeting ID and password
      if (meetingId.includes('/meeting-room/')) {
        const url = new URL(meetingId.includes('http') ? meetingId : `http://localhost${meetingId}`);
        const pathParts = url.pathname.split('/');
        finalMeetingId = pathParts[pathParts.length - 1];
        finalPassword = url.searchParams.get('password') || password;
      }
      
      // Navigate to meeting room
      const url = finalPassword
        ? `/meeting-room/${finalMeetingId}?password=${finalPassword}`
        : `/meeting-room/${finalMeetingId}`;
      
      navigate(url);
      onClose();
      
    } catch (error) {
      console.error('Error joining meeting:', error);
      setError('Failed to join meeting. Please check the meeting ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setMeetingId(initialMeetingId);
    setPassword('');
    setUserName('');
    setNeedsPassword(false);
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleMeetingIdChange = (value: string) => {
    setMeetingId(value);
    setError('');
    
    // Check if the meeting ID or URL suggests it's password protected
    if (value.includes('password=') || value.includes('private')) {
      setNeedsPassword(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Join Meeting</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* User Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Required)
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Meeting ID or Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting ID or Link
            </label>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => handleMeetingIdChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter meeting ID or paste meeting link"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You can enter either a meeting ID or paste the complete meeting link
            </p>
          </div>

          {/* Password (shown if needed) */}
          {(needsPassword || password) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-1">
                  <Lock className="h-4 w-4 text-red-600" />
                  <span>Meeting Password</span>
                </div>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter meeting password"
              />
            </div>
          )}

          {/* Password Toggle */}
          {!needsPassword && !password && (
            <div>
              <button
                type="button"
                onClick={() => setNeedsPassword(true)}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
              >
                <Lock className="h-4 w-4" />
                <span>This meeting requires a password</span>
              </button>
            </div>
          )}

          {/* Meeting Info */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Users className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">Joining meeting as: {userName || 'Anonymous'}</p>
                <p className="text-sm">
                  {meetingId ? `Meeting ID: ${meetingId.split('/').pop() || meetingId}` : 'Enter meeting details above'}
                </p>
                {(needsPassword || password) && (
                  <p className="text-sm flex items-center mt-1">
                    <Lock className="h-3 w-3 mr-1" />
                    Password protected meeting
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinMeeting}
              disabled={!userName.trim() || !meetingId.trim() || isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining...</span>
                </div>
              ) : (
                'Join Meeting'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
