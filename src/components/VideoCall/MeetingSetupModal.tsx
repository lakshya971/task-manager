import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Lock, 
  Globe, 
  Copy, 
  Check, 
  X,
  Users
} from 'lucide-react';

interface MeetingSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingSetupModal({ isOpen, onClose }: MeetingSetupModalProps) {
  const navigate = useNavigate();
  const [meetingType, setMeetingType] = useState<'public' | 'private'>('public');
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [step, setStep] = useState<'setup' | 'preview'>('setup');

  const generateMeetingId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 6);
    return `${timestamp}-${randomStr}`;
  };

  const generatePassword = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  const handleCreateMeeting = () => {
    const newMeetingId = meetingId || generateMeetingId();
    const meetingPassword = meetingType === 'private' ? (password || generatePassword()) : '';
    
    // Generate meeting link
    const baseUrl = window.location.origin;
    const link = meetingType === 'private' 
      ? `${baseUrl}/meeting-room/${newMeetingId}?password=${meetingPassword}`
      : `${baseUrl}/meeting-room/${newMeetingId}`;
    
    setGeneratedLink(link);
    setMeetingId(newMeetingId);
    if (meetingType === 'private' && !password) {
      setPassword(meetingPassword);
    }
    setStep('preview');
  };

  const handleJoinMeeting = () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Store user info in localStorage for the meeting
    localStorage.setItem('meetingUserName', userName);
    localStorage.setItem('meetingUserId', Date.now().toString());
    
    // Navigate to meeting room
    const url = meetingType === 'private' && password
      ? `/meeting-room/${meetingId}?password=${password}`
      : `/meeting-room/${meetingId}`;
    
    navigate(url);
    onClose();
  };

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const resetModal = () => {
    setStep('setup');
    setMeetingId('');
    setPassword('');
    setUserName('');
    setGeneratedLink('');
    setLinkCopied(false);
    setMeetingType('public');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'setup' ? 'Start New Meeting' : 'Meeting Created'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'setup' ? (
          <div className="p-6 space-y-6">
            {/* User Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (Required)
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Meeting Type
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="meetingType"
                    value="public"
                    checked={meetingType === 'public'}
                    onChange={(e) => setMeetingType(e.target.value as 'public' | 'private')}
                    className="mr-3"
                  />
                  <Globe className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Public Meeting</div>
                    <div className="text-sm text-gray-600">Anyone with the link can join</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="meetingType"
                    value="private"
                    checked={meetingType === 'private'}
                    onChange={(e) => setMeetingType(e.target.value as 'public' | 'private')}
                    className="mr-3"
                  />
                  <Lock className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Private Meeting</div>
                    <div className="text-sm text-gray-600">Password protected</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Meeting ID (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting ID (Optional)
              </label>
              <input
                type="text"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave blank to auto-generate"
              />
            </div>

            {/* Password (for private meetings) */}
            {meetingType === 'private' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Password (Optional)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave blank to auto-generate"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={!userName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Meeting
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Meeting Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Meeting ID:</span>
                <span className="text-sm font-mono text-gray-900">{meetingId}</span>
              </div>
              {meetingType === 'private' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password:</span>
                  <span className="text-sm font-mono text-gray-900">{password}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <div className="flex items-center">
                  {meetingType === 'public' ? (
                    <>
                      <Globe className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-700">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-red-600 mr-1" />
                      <span className="text-sm text-red-700">Private</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Meeting Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyMeetingLink}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Share this meeting:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Copy and share the meeting link</li>
                    <li>• Or share the Meeting ID: <strong>{meetingId}</strong></li>
                    {meetingType === 'private' && (
                      <li>• Password: <strong>{password}</strong></li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleJoinMeeting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Join Meeting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
