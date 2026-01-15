/**
 * Dashboard Component
 * Main dashboard with role-based navigation and views
 * Displays tasks, calendar, and user management based on user role
 */
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TaskList from './TaskList';
import CalendarView from './CalendarView';
import UserManagement from './UserManagement';
import TeamMembers from './TeamMembers';
import { LayoutDashboard, Calendar, Users, LogOut, Menu, X } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('tasks');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState('');

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.name || user?.username || user?.email || 'User';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold text-gray-800">Task Manager</h2>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2 flex-1">
          <button
            onClick={() => setCurrentView('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'tasks' 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <LayoutDashboard size={20} />
            {sidebarOpen && <span>Tasks</span>}
          </button>

          <button
            onClick={() => setCurrentView('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === 'calendar' 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Calendar size={20} />
            {sidebarOpen && <span>Calendar</span>}
          </button>

          {/* User Management - Admin only */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setCurrentView('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'users' 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Users size={20} />
              {sidebarOpen && <span>Users</span>}
            </button>
          )}

          {/* Team Members - Manager and Admin */}
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <button
              onClick={() => setCurrentView('team')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'team' 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Users size={20} />
              {sidebarOpen && <span>{user?.role === 'admin' ? 'Teams' : 'My Team'}</span>}
            </button>
          )}
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-800">{getUserDisplayName()}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm p-6 border-b sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {currentView === 'tasks' && 'Tasks'}
                {currentView === 'calendar' && 'Calendar'}
                {currentView === 'users' && 'User Management'}
                {currentView === 'team' && (user?.role === 'admin' ? 'Teams Management' : 'My Team')}
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {getUserDisplayName()}
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="m-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* View Content */}
        <div className="p-6">
          {currentView === 'tasks' && <TaskList onError={setError} />}
          {currentView === 'calendar' && <CalendarView onError={setError} />}
          {currentView === 'users' && user?.role === 'admin' && <UserManagement onError={setError} />}
          {currentView === 'team' && (user?.role === 'manager' || user?.role === 'admin') && <TeamMembers onError={setError} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

