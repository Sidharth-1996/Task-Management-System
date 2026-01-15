/**
 * UserModal Component
 * Modal form for creating and editing users (Admin only)
 */
import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { X } from 'lucide-react';

const UserModal = ({ user, onClose, onSave }) => {
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    manager_id: '',
  });
  
  // State for managers list (for manager assignment dropdown)
  const [managers, setManagers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load managers for manager assignment dropdown
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const usersData = await usersAPI.getUsers();
        const allUsers = Array.isArray(usersData) ? usersData : usersData.results || [];
        // Filter to only managers
        const managersList = allUsers.filter(u => u.role === 'manager');
        setManagers(managersList);
      } catch (error) {
        console.error('Failed to load managers:', error);
      }
    };
    loadManagers();
  }, []);

  // Initialize form data when user is provided (edit mode)
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'user',
        manager_id: user.manager?.id || user.manager_id || '',
      });
    }
  }, [user]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    // Validate password for new users
    if (!user && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    // Validate password length if provided
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Prepare user data
      const userData = {
        username: formData.username || formData.email,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        ...(formData.password && { password: formData.password }),
        // Include manager_id if provided (only for users with role='user')
        ...(formData.role === 'user' && formData.manager_id && { manager_id: parseInt(formData.manager_id) }),
        // If manager_id is empty string, set to null to remove manager
        ...(formData.role === 'user' && formData.manager_id === '' && { manager_id: null }),
      };

      // Create or update user
      if (user) {
        await usersAPI.updateUser(user.id, userData);
      } else {
        await usersAPI.createUser(userData);
      }

      // Call onSave callback to refresh user list
      onSave();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message ||
                          Object.values(error.response?.data || {}).flat().join(', ') ||
                          'Failed to save user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              {user ? 'Edit User' : 'Create New User'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* User Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username (optional)
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="username (defaults to email)"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {!user && <span className="text-red-500">*</span>}
              {user && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              minLength={6}
              required={!user}
            />
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value;
                // Clear manager_id if role is not 'user'
                setFormData({ 
                  ...formData, 
                  role: newRole,
                  manager_id: newRole === 'user' ? formData.manager_id : ''
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Manager Assignment (only for users with role='user') */}
          {formData.role === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Manager
              </label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Manager (Unassigned)</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.first_name && m.last_name 
                      ? `${m.first_name} ${m.last_name} (${m.email})`
                      : m.username || m.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a manager to assign this user to their team. Managers can see and manage tasks assigned to their team members.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;

