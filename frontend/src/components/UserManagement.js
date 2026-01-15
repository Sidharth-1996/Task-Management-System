/**
 * UserManagement Component
 * Admin-only component for managing users
 * Allows creating, editing, and deleting users
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import UserModal from './UserModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const UserManagement = ({ onError }) => {
  const { user } = useAuth();
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  /**
   * Load users from API
   */
  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await usersAPI.getUsers();
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to load users';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Load users on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user?.role, loadUsers]);

  /**
   * Handle user deletion
   */
  const handleDeleteUser = async (id) => {
    // Prevent deleting yourself
    if (id === user?.id) {
      if (onError) onError('You cannot delete your own account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await usersAPI.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete user';
      if (onError) onError(errorMessage);
    }
  };

  /**
   * Get role badge styling
   */
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'manager':
        return 'bg-blue-100 text-blue-700';
      case 'user':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = (u) => {
    if (u.first_name && u.last_name) {
      return `${u.first_name} ${u.last_name}`;
    }
    return u.name || u.username || u.email || 'Unknown User';
  };

  // Only show if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditingUser(null);
              setShowUserModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            New User
          </button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No users found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{getUserDisplayName(u)}</h3>
                  <p className="text-gray-600">{u.email}</p>
                  <div className="flex gap-4 mt-2 flex-wrap">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${getRoleBadgeClass(u.role)}`}>
                      {u.role?.toUpperCase() || 'USER'}
                    </span>
                    {u.manager_name && (
                      <span className="text-xs text-gray-500">
                        Manager: {u.manager_name}
                      </span>
                    )}
                    {u.id === user?.id && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setShowUserModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label="Edit user"
                  >
                    <Edit2 size={18} />
                  </button>
                  {/* Don't show delete button for current user */}
                  {u.id !== user?.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            loadUsers();
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;

