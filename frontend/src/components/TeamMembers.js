/**
 * TeamMembers Component
 * Displays list of team members assigned to the current manager
 * Managers can see their team, Admins can see all teams and manage them
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import UserModal from './UserModal';
import { Edit2, Trash2, UserPlus } from 'lucide-react';

const TeamMembers = ({ onError }) => {
  const { user } = useAuth();
  
  // State management
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  /**
   * Fetch team members from API
   */
  const loadTeamMembers = React.useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await usersAPI.getUsers();
      const allUsers = Array.isArray(usersData) ? usersData : usersData.results || [];
      
      if (user?.role === 'admin') {
        // Admin sees all users grouped by manager
        setTeamMembers(allUsers);
      } else if (user?.role === 'manager') {
        // Manager: Backend already filters to only their team members via UserListView.get_queryset()
        // The backend returns users where manager=current_user, so we can use allUsers directly
        // The backend UserListView.get_queryset() filters: User.objects.filter(manager=user)
        // So allUsers should already contain only the manager's team members
        setTeamMembers(allUsers);
      } else {
        setTeamMembers([]);
      }
      
      if (onError) onError('');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to load team members';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, onError]);

  // Load team members
  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  /**
   * Group users by manager (for Admin view)
   */
  const groupByManager = (users) => {
    const grouped = {
      unassigned: [],
      managers: {}
    };

    users.forEach(u => {
      if (u.role === 'manager') {
        // Manager themselves
        if (!grouped.managers[u.id]) {
          grouped.managers[u.id] = {
            manager: u,
            members: []
          };
        }
      } else if (u.role === 'user') {
        // Regular users
        if (u.manager) {
          if (!grouped.managers[u.manager.id]) {
            grouped.managers[u.manager.id] = {
              manager: u.manager,
              members: []
            };
          }
          grouped.managers[u.manager.id].members.push(u);
        } else {
          grouped.unassigned.push(u);
        }
      }
    });

    return grouped;
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = (u) => {
    if (u.first_name && u.last_name) {
      return `${u.first_name} ${u.last_name}`;
    }
    return u.username || u.email || 'Unknown';
  };

  /**
   * Handle user save (create or update)
   */
  const handleSaveUser = () => {
    setShowUserModal(false);
    setEditingUser(null);
    loadTeamMembers();
  };

  /**
   * Handle delete user (Admin only)
   */
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await usersAPI.deleteUser(userId);
      loadTeamMembers();
      if (onError) onError('');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete user';
      if (onError) onError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Manager view: Show their team members
  if (user?.role === 'manager') {
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">My Team Members</h2>
              <p className="text-gray-600">
                {teamMembers.length > 0 
                  ? `You have ${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''} assigned to you.`
                  : 'No team members assigned yet. Contact Admin to assign users to your team.'}
              </p>
            </div>
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No team members found</p>
            <p className="text-sm mt-2">Contact Admin to assign users to your team</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map(member => (
              <div key={member.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {getUserDisplayName(member)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{member.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {member.role?.toUpperCase() || 'USER'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium mr-2">Username:</span>
                    <span>{member.username || 'N/A'}</span>
                  </div>
                  {member.first_name && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">First Name:</span>
                      <span>{member.first_name}</span>
                    </div>
                  )}
                  {member.last_name && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">Last Name:</span>
                      <span>{member.last_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Admin view: Show all teams grouped by manager with management capabilities
  const grouped = groupByManager(teamMembers);
  const managerIds = Object.keys(grouped.managers);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Teams Management</h2>
            <p className="text-gray-600">
              View, manage, and organize all teams and their members. You can assign users to managers, update user details, and delete users.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowUserModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <UserPlus size={20} />
            Add User
          </button>
        </div>
      </div>

      {/* Teams by Manager */}
      {managerIds.length > 0 && (
        <div className="space-y-6 mb-6">
          {managerIds.map(managerId => {
            const team = grouped.managers[managerId];
            return (
              <div key={managerId} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {getUserDisplayName(team.manager)}'s Team
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{team.manager.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    MANAGER
                  </span>
                </div>

                {team.members.length === 0 ? (
                  <p className="text-gray-500 text-sm">No team members assigned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {team.members.map(member => (
                      <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{getUserDisplayName(member)}</h4>
                            <p className="text-sm text-gray-500 mt-1">{member.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(member);
                                setShowUserModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              aria-label="Edit user"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(member.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              aria-label="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {member.role?.toUpperCase() || 'USER'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned Users */}
      {grouped.unassigned.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Unassigned Users</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped.unassigned.map(u => (
              <div key={u.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{getUserDisplayName(u)}</h4>
                    <p className="text-sm text-gray-500 mt-1">{u.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setShowUserModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      aria-label="Edit user"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                  {u.role?.toUpperCase() || 'USER'} - NO MANAGER
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Modal for Admin */}
      {showUserModal && user?.role === 'admin' && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {/* Empty state */}
      {managerIds.length === 0 && grouped.unassigned.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No teams found</p>
          <p className="text-sm mt-2">Create users and assign them to managers to see teams</p>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;

