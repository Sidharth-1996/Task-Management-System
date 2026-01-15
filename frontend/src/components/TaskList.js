/**
 * TaskList Component
 * Displays list of tasks with filters, search, and pagination
 * Role-based task filtering and permissions
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI, usersAPI } from '../services/api';
import TaskModal from './TaskModal';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';


const TaskList = ({ onError }) => {
  const { user } = useAuth();
  
  // State management
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all'); // Filter by assigned user
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);

  /**
   * Load tasks from API with filters and pagination
   */
  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(assignedToFilter !== 'all' && { assigned_to: assignedToFilter }),
      };
      
      const response = await tasksAPI.getTasks(params);
      
      // Handle paginated response (Django REST Framework pagination)
      if (response && typeof response === 'object' && 'results' in response) {
        setTasks(response.results || []);
        setTotalPages(Math.ceil((response.count || 0) / 10) || 1);
      } else if (Array.isArray(response)) {
        // Handle non-paginated response (array of tasks)
        setTasks(response);
        setTotalPages(1);
      } else {
        // Unexpected response format
        console.warn('Unexpected response format:', response);
        setTasks([]);
        setTotalPages(1);
      }
      // Clear any previous errors on success
      if (onError) onError('');
    } catch (error) {
      console.error('Error loading tasks:', error);
      let errorMessage = 'Failed to load tasks';
      
      if (error.response) {
        // Server responded with error
        const data = error.response.data;
        errorMessage = data.detail || 
                      data.message || 
                      (typeof data === 'string' ? data : 'Failed to load tasks');
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      }
      
      if (onError) onError(errorMessage);
      // Set empty tasks array on error
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [onError, currentPage, searchQuery, statusFilter, assignedToFilter]);

  const loadUsers = React.useCallback(async () => {
    try {
      const usersData = await usersAPI.getUsers();
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  // Load users when user changes (for Admin and Manager)
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadUsers();
    }
  }, [user, loadUsers]);

  // Load tasks on component mount and when filters change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /**
   * Handle task deletion
   */
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await tasksAPI.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete task';
      if (onError) onError(errorMessage);
    }
  };

  /**
   * Handle task status update (for regular users)
   */
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateTask(taskId, { status: newStatus });
      loadTasks(); // Reload tasks
      // Clear any previous errors on success
      if (onError) onError('');
    } catch (error) {
      console.error('Status update error:', error);
      let errorMessage = 'Failed to update task status';
      
      if (error.response) {
        const data = error.response.data;
        // Handle different error formats
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.status) {
          errorMessage = Array.isArray(data.status) ? data.status[0] : data.status;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      }
      
      if (onError) onError(errorMessage);
    }
  };

  /**
   * Get status badge styling
   */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'inprogress':
        return 'bg-blue-100 text-blue-700';
      case 'todo':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  /**
   * Check if user can edit task (open edit modal)
   * Regular users cannot edit tasks via modal - they can only change status via dropdown
   */
  const canEditTask = (task) => {
    // Only Admin and Manager can open the edit modal
    // Regular users can only change status via the dropdown in the task card
    return user?.role === 'admin' || user?.role === 'manager';
  };

  /**
   * Check if user can delete task
   */
  const canDeleteTask = (task) => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Filter by assigned user (Admin and Manager only) */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <select
              value={assignedToFilter}
              onChange={(e) => {
                setAssignedToFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              {users && users.length > 0 && users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.first_name && u.last_name 
                    ? `${u.first_name} ${u.last_name}`
                    : u.username || u.email}
                </option>
              ))}
            </select>
          )}

          {/* Create Task Button (Admin and Manager only) */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-2">Create a new task to get started</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            {tasks.map(task => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h3>
                    <p className="text-gray-600 mb-4">{task.description || 'No description'}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${getStatusBadgeClass(task.status)}`}>
                        {task.status?.replace('_', ' ').toUpperCase() || 'TODO'}
                      </span>
                      
                      {/* Overdue label */}
                      {task.is_overdue && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                          OVERDUE
                        </span>
                      )}
                      
                      {task.due_date && (
                        <span className="text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      
                      {task.assigned_at && (
                        <span className="text-gray-500">
                          Assigned: {new Date(task.assigned_at).toLocaleDateString()} {new Date(task.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      
                      {task.assigned_to && (
                        <span className="text-gray-500">
                          Assigned to: {task.assigned_to.first_name && task.assigned_to.last_name
                            ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}`
                            : task.assigned_to.username || task.assigned_to.email}
                        </span>
                      )}
                      
                      {task.created_by && (
                        <span className="text-gray-500">
                          Created by: {task.created_by.first_name && task.created_by.last_name
                            ? `${task.created_by.first_name} ${task.created_by.last_name}`
                            : task.created_by.username || task.created_by.email}
                        </span>
                      )}
                    </div>

                    {/* Status Update for Users */}
                    {user?.role === 'user' && task.assigned_to?.id === user?.id && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700 mr-2">Update Status:</label>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="todo">To Do</option>
                          <option value="inprogress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    {canEditTask(task) && (
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setShowTaskModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Edit task"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}

                    {canDeleteTask(task) && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete task"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="px-4 py-2 text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          users={users}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={() => {
            loadTasks();
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default TaskList;

