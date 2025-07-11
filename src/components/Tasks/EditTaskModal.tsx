import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Tag, Clock, CheckCircle } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { mockUsers } from '../../data/mockData';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSubmit: (updatedTask: Task) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmit
}) => {
  useAuth();
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate.toISOString().split('T')[0],
    tags: task.tags.join(', '),
    estimatedHours: task.estimatedHours?.toString() || '',
    actualHours: task.actualHours?.toString() || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate.toISOString().split('T')[0],
      tags: task.tags.join(', '),
      estimatedHours: task.estimatedHours?.toString() || '',
      actualHours: task.actualHours?.toString() || ''
    });
  }, [task]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    }

    if (!formData.assigneeId) {
      newErrors.assigneeId = 'Please select an assignee';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (formData.estimatedHours && (isNaN(Number(formData.estimatedHours)) || Number(formData.estimatedHours) <= 0)) {
      newErrors.estimatedHours = 'Estimated hours must be a positive number';
    }

    if (formData.actualHours && (isNaN(Number(formData.actualHours)) || Number(formData.actualHours) < 0)) {
      newErrors.actualHours = 'Actual hours must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const updatedTask: Task = {
      ...task,
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      assigneeId: formData.assigneeId,
      dueDate: new Date(formData.dueDate),
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
      actualHours: formData.actualHours ? Number(formData.actualHours) : undefined,
      updatedAt: new Date(),
      completedAt: formData.status === 'completed' && task.status !== 'completed' ? new Date() : task.completedAt
    };

    onSubmit(updatedTask);
    setErrors({});
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'in_review': return 'text-yellow-600';
      case 'not_started': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : ''
              }`}
              placeholder="Enter task title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : ''
              }`}
              placeholder="Describe the task in detail"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <CheckCircle className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${getStatusColor(formData.status)}`} />
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as TaskStatus)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <div className="relative">
                <Flag className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${getPriorityColor(formData.priority)}`} />
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assignee */}
            <div>
              <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-1">
                Assign To *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="assigneeId"
                  value={formData.assigneeId}
                  onChange={(e) => handleInputChange('assigneeId', e.target.value)}
                  className={`pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.assigneeId ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select assignee</option>
                  {mockUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              {errors.assigneeId && <p className="mt-1 text-sm text-red-600">{errors.assigneeId}</p>}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={`pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.dueDate ? 'border-red-300' : ''
                  }`}
                />
              </div>
              {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estimated Hours */}
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  id="estimatedHours"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                  className={`pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.estimatedHours ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g., 2.5"
                />
              </div>
              {errors.estimatedHours && <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>}
            </div>

            {/* Actual Hours */}
            <div>
              <label htmlFor="actualHours" className="block text-sm font-medium text-gray-700 mb-1">
                Actual Hours
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <input
                  type="number"
                  id="actualHours"
                  min="0"
                  step="0.5"
                  value={formData.actualHours}
                  onChange={(e) => handleInputChange('actualHours', e.target.value)}
                  className={`pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.actualHours ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g., 3.0"
                />
              </div>
              {errors.actualHours && <p className="mt-1 text-sm text-red-600">{errors.actualHours}</p>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., frontend, urgent, bug (separate with commas)"
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
