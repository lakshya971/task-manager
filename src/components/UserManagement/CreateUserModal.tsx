import React, { useState } from 'react';
import { X, User, Mail, Building, Shield } from 'lucide-react';
import { User as UserType, UserRole, ROLE_NAMES } from '../../types/roles';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Omit<UserType, 'id' | 'createdAt' | 'createdBy'>) => void;
  creatableRoles: UserRole[];
  departments: string[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  creatableRoles,
  departments
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: creatableRoles[0] || UserRole.EMPLOYEE,
    department: departments[0] || '',
    managerId: '',
    isActive: true,
    status: 'active' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      department: formData.department.trim(),
      managerId: formData.managerId || undefined,
      isActive: formData.isActive,
      status: formData.status
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      role: creatableRoles[0] || UserRole.EMPLOYEE,
      department: departments[0] || '',
      managerId: '',
      isActive: true,
      status: 'active'
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create New User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : ''
                }`}
                placeholder="Enter full name"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : ''
                }`}
                placeholder="Enter email address"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {creatableRoles.map(role => (
                  <option key={role} value={role}>
                    {ROLE_NAMES[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className={`pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.department ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => {
                  handleInputChange('isActive', e.target.checked);
                  handleInputChange('status', e.target.checked ? 'active' : 'inactive');
                }}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">User is active</span>
            </label>
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
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
