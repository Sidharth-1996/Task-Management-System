/**
 * TaskModal Component
 * Modal form for creating and editing tasks
 * Role-based field permissions
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI } from '../services/api';
import { X } from 'lucide-react';

const TaskModal = ({ task, users, onClose, onSave }) => {
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    assigned_to_id: '',
    due_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form data when task is provided (edit mode)
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        assigned_to_id: task.assigned_to?.id || '',
        due_date: task.due_date || '',
      });
    }
  }, [task]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields (only for Admin/Manager creating new tasks)
    if ((user?.role === 'admin' || user?.role === 'manager') && !task && !formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    try {
      // Prepare task data based on user role
      let taskData = {};

      // Regular users can ONLY update status - nothing else
      if (user?.role === 'user') {
        // Users can ONLY update status - nothing else
        taskData = {
          status: formData.status,
        };
      } else {
        // Admin and Manager can update all fields
        taskData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
        };
        if (formData.assigned_to_id) {
          taskData.assigned_to_id = parseInt(formData.assigned_to_id);
        }
        if (formData.due_date) {
          taskData.due_date = formData.due_date;
        }
      }

      // Create or update task
      if (task) {
        await tasksAPI.updateTask(task.id, taskData);
      } else {
        await tasksAPI.createTask(taskData);
      }

      // Call onSave callback to refresh task list
      onSave();
    } catch (error) {
      console.error('Task creation error:', error);
      
      let errorMessage = 'Failed to save task';
      
      if (error.response) {
        const data = error.response.data;
        
        // Handle HTML error pages (Django debug pages)
        if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
          // Extract error message from HTML if possible
          const match = data.match(/<pre class="exception_value">(.*?)<\/pre>/);
          if (match) {
            errorMessage = `Server Error: ${match[1]}`;
          } else {
            errorMessage = 'Server error occurred. Please check the backend console for details.';
          }
        } 
        // Handle JSON error responses
        else if (typeof data === 'object') {
          errorMessage = data.detail || 
                        data.message ||
                        (data.non_field_errors ? (Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors) : null) ||
                        Object.entries(data)
                          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
                          .join(', ') ||
                        'Failed to save task';
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              {task ? 'Edit Task' : 'Create New Task'}
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

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* For regular users: Only show status field */}
          {user?.role === 'user' ? (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Task Information</p>
                <p className="text-sm text-gray-700"><strong>Title:</strong> {formData.title || 'N/A'}</p>
                {formData.description && (
                  <p className="text-sm text-gray-700 mt-1"><strong>Description:</strong> {formData.description}</p>
                )}
                {formData.due_date && (
                  <p className="text-sm text-gray-700 mt-1"><strong>Due Date:</strong> {new Date(formData.due_date).toLocaleDateString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-gray-500 text-xs">(You can only change this)</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Only Admin and Manager can modify other task details.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Title Field - Admin and Manager only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                  required
                />
              </div>

              {/* Description Field - Admin and Manager only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task description"
                />
              </div>

              {/* Status Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Due Date Field - Admin and Manager only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Assign To Field (Admin and Manager only) */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <select
                value={formData.assigned_to_id}
                onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!users || users.length === 0}
              >
                <option value="">
                  {!users || users.length === 0 
                    ? (user?.role === 'manager' 
                        ? 'No team members assigned' 
                        : 'Loading users...')
                    : 'Select user...'}
                </option>
                {users && users.length > 0 && users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name && u.last_name 
                      ? `${u.first_name} ${u.last_name} (${u.email})`
                      : u.username || u.email}
                  </option>
                ))}
              </select>
              {(!users || users.length === 0) && (
                <p className="text-xs text-gray-500 mt-1">
                  {user?.role === 'manager' 
                    ? 'No team members assigned. Contact Admin to assign users to your team.'
                    : 'Loading available users...'}
                </p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
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

export default TaskModal;

