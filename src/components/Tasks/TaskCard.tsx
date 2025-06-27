
import { Calendar, MessageCircle, Paperclip, Clock, Video, Edit, Trash2 } from 'lucide-react';
import { Task } from '../../types';
import { mockUsers } from '../../data/mockData';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export function TaskCard({ task, onClick, onEdit, onDelete, canEdit = false, canDelete = false }: TaskCardProps) {
  const assignee = mockUsers.find(u => u.id === task.assigneeId);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
      onClick={onClick}
    >
      {/* Action buttons */}
      {(canEdit || canDelete) && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit task"
            >
              <Edit className="h-3 w-3" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 pr-8">{task.title}</h3>
        <div className="flex space-x-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {format(task.dueDate, 'MMM d')}
          </div>
          {task.estimatedHours && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {task.estimatedHours}h
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {task.attachments.length > 0 && (
            <div className="flex items-center">
              <Paperclip className="h-3 w-3 mr-1" />
              {task.attachments.length}
            </div>
          )}
          {task.comments.length > 0 && (
            <div className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {task.comments.length}
            </div>
          )}
          <Link 
            to={`/video-call/${task.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            title="Start video call for this task"
          >
            <Video className="h-3 w-3 mr-1" />
            Call
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {assignee?.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="text-sm text-gray-600">{assignee?.name}</span>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}