import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Link2, 
  Play,
  Copy,
  Check
} from 'lucide-react';
import { MeetingSetupModal } from '../components/VideoCall/MeetingSetupModal';
import { JoinMeetingModal } from '../components/VideoCall/JoinMeetingModal';

interface Meeting {
  id: string;
  title: string;
  scheduledTime: Date;
  duration: number;
  participants: string[];
  roomId: string;
  isActive: boolean;
  createdBy: string;
}

// Mock data for meetings
const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Project Kickoff Meeting',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    duration: 60,
    participants: ['john@example.com', 'jane@example.com', 'mike@example.com'],
    roomId: 'project-kickoff-123',
    isActive: false,
    createdBy: 'current-user'
  },
  {
    id: '2',
    title: 'Daily Standup',
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 30,
    participants: ['team@example.com'],
    roomId: 'daily-standup-456',
    isActive: false,
    createdBy: 'current-user'
  }
];

export function Meetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMeetingSetup, setShowMeetingSetup] = useState(false);
  const [showJoinMeeting, setShowJoinMeeting] = useState(false);
  const [initialJoinMeetingId, setInitialJoinMeetingId] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    scheduledTime: '',
    duration: 60,
    participants: ''
  });

  const generateRoomId = () => {
    return `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const startInstantMeeting = () => {
    setShowMeetingSetup(true);
  };

  const joinMeeting = (roomId: string) => {
    navigate(`/meeting-room/${roomId}`);
  };

  const copyRoomLink = async (roomId: string) => {
    const meetingLink = `${window.location.origin}/meeting-room/${roomId}`;
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCreateMeeting = () => {
    if (!newMeeting.title.trim()) return;

    const meeting: Meeting = {
      id: Date.now().toString(),
      title: newMeeting.title,
      scheduledTime: new Date(newMeeting.scheduledTime),
      duration: newMeeting.duration,
      participants: newMeeting.participants.split(',').map(email => email.trim()).filter(Boolean),
      roomId: generateRoomId(),
      isActive: false,
      createdBy: 'current-user'
    };

    setMeetings([...meetings, meeting]);
    setNewMeeting({ title: '', scheduledTime: '', duration: 60, participants: '' });
    setShowCreateForm(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (date: Date) => {
    return date.getTime() > Date.now();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meetings</h1>
        <p className="text-gray-600">Schedule, start, and join video meetings</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Start Instant Meeting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Start Instant Meeting</h3>
              <p className="text-sm text-gray-600">Begin a meeting right now</p>
            </div>
          </div>
          <button
            onClick={startInstantMeeting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Play className="h-4 w-4 mr-2 inline" />
            Start Meeting
          </button>
        </div>

        {/* Schedule Meeting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule Meeting</h3>
              <p className="text-sm text-gray-600">Plan a meeting for later</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Schedule
          </button>
        </div>

        {/* Join Meeting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Link2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Join Meeting</h3>
              <p className="text-sm text-gray-600">Enter a meeting ID or link</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Meeting ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const meetingId = (e.target as HTMLInputElement).value.trim();
                  setInitialJoinMeetingId(meetingId);
                  setShowJoinMeeting(true);
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Meeting ID"]') as HTMLInputElement;
                const meetingId = input?.value.trim() || '';
                setInitialJoinMeetingId(meetingId);
                setShowJoinMeeting(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Meetings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Meetings</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {meetings.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No scheduled meetings</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Schedule your first meeting
              </button>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div key={meeting.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                      {isUpcoming(meeting.scheduledTime) && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(meeting.scheduledTime)}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {meeting.participants.length} participants
                      </div>
                      <div>Duration: {meeting.duration} min</div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Room ID: {meeting.roomId}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyRoomLink(meeting.roomId)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy meeting link"
                    >
                      {copiedRoomId === meeting.roomId ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => joinMeeting(meeting.roomId)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Meeting</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meeting title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={newMeeting.scheduledTime}
                  onChange={(e) => setNewMeeting({ ...newMeeting, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={newMeeting.duration}
                  onChange={(e) => setNewMeeting({ ...newMeeting, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participants (comma-separated emails)
                </label>
                <textarea
                  value={newMeeting.participants}
                  onChange={(e) => setNewMeeting({ ...newMeeting, participants: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com, jane@example.com"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={!newMeeting.title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Setup Modal */}
      <MeetingSetupModal 
        isOpen={showMeetingSetup}
        onClose={() => setShowMeetingSetup(false)}
      />

      {/* Join Meeting Modal */}
      <JoinMeetingModal 
        isOpen={showJoinMeeting}
        onClose={() => setShowJoinMeeting(false)}
        initialMeetingId={initialJoinMeetingId}
      />
    </div>
  );
}
