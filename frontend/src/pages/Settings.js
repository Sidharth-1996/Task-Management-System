import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Building2, Users, Shield, DollarSign, Settings as SettingsIcon, Key, Plus, Mail, AlertTriangle, Info } from 'lucide-react';
import { settingsAPI, usersAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { SkeletonTableRow } from '../components/ui/Skeleton';

const Settings = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('organization');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  
  const originalOrgSettings = useRef({});
  const originalSystemPrefs = useRef({});

  const [orgSettings, setOrgSettings] = useState({
    organization_name: 'WorkForge HR',
    company_address: '',
    working_days: 'mon-fri',
    custom_working_days: [],
    default_working_hours_start: '09:00',
    default_working_hours_end: '18:00',
    currency: 'INR',
    currency_symbol: '₹',
    working_days_per_month: 26,
  });

  const [systemPrefs, setSystemPrefs] = useState({
    allow_self_registration: false,
    session_timeout_minutes: 60,
    force_password_reset: false,
    theme_mode: 'light',
    date_format: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',
    enable_notifications: true,
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
  });

  const [errors, setErrors] = useState({});

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [orgData, prefsData] = await Promise.all([
        settingsAPI.getOrganizationSettings(),
        settingsAPI.getSystemPreferences(),
      ]);
      setOrgSettings(orgData);
      setSystemPrefs(prefsData);
      originalOrgSettings.current = JSON.parse(JSON.stringify(orgData));
      originalSystemPrefs.current = JSON.parse(JSON.stringify(prefsData));
    } catch (error) {
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await usersAPI.getUsers();
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      addToast('Failed to load users', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadSettings();
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [loadSettings, loadUsers, user?.role]);

  const isOrgDirty = () => {
    return JSON.stringify(orgSettings) !== JSON.stringify(originalOrgSettings.current);
  };

  const isSystemDirty = () => {
    return JSON.stringify(systemPrefs) !== JSON.stringify(originalSystemPrefs.current);
  };

  const validateOrgSettings = () => {
    const newErrors = {};
    if (!orgSettings.organization_name?.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }
    if (orgSettings.default_working_hours_start >= orgSettings.default_working_hours_end) {
      newErrors.working_hours = 'Start time must be before end time';
    }
    if (orgSettings.working_days_per_month < 1 || orgSettings.working_days_per_month > 31) {
      newErrors.working_days_per_month = 'Working days must be between 1 and 31';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSystemPrefs = () => {
    const newErrors = {};
    if (systemPrefs.session_timeout_minutes < 5) {
      newErrors.session_timeout = 'Session timeout must be at least 5 minutes';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveOrganization = async () => {
    if (!validateOrgSettings()) {
      addToast('Please fix validation errors', 'error');
      return;
    }
    try {
      setSaving(true);
      await settingsAPI.updateOrganizationSettings(orgSettings);
      originalOrgSettings.current = JSON.parse(JSON.stringify(orgSettings));
      addToast('Organization settings saved successfully', 'success');
    } catch (error) {
      addToast(error.response?.data?.detail || 'Failed to save organization settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemPrefs = async () => {
    if (!validateSystemPrefs()) {
      addToast('Please fix validation errors', 'error');
      return;
    }
    try {
      setSaving(true);
      await settingsAPI.updateSystemPreferences(systemPrefs);
      originalSystemPrefs.current = JSON.parse(JSON.stringify(systemPrefs));
      addToast('System preferences saved successfully', 'success');
    } catch (error) {
      addToast(error.response?.data?.detail || 'Failed to save system preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await settingsAPI.resetUserPassword(selectedUser.id, newPassword);
      addToast('Password reset successfully', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      addToast(error.response?.data?.detail || 'Failed to reset password', 'error');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    // Check if this is the last admin
    if (userToUpdate.role === 'admin' && newRole !== 'admin') {
      const adminCount = users.filter(u => u.role === 'admin' && u.is_active).length;
      if (adminCount <= 1) {
        addToast('Cannot remove the last admin user', 'error');
        return;
      }
    }

    setPendingRoleChange({ userId, newRole, userName: userToUpdate.first_name || userToUpdate.username });
    setShowRoleConfirmModal(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    
    try {
      const userToUpdate = users.find(u => u.id === pendingRoleChange.userId);
      await usersAPI.updateUser(pendingRoleChange.userId, { ...userToUpdate, role: pendingRoleChange.newRole });
      addToast('User role updated successfully', 'success');
      loadUsers();
    } catch (error) {
      addToast(error.response?.data?.detail || 'Failed to update user role', 'error');
    } finally {
      setShowRoleConfirmModal(false);
      setPendingRoleChange(null);
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    if (isActive && userToUpdate.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin' && u.is_active).length;
      if (adminCount <= 1) {
        addToast('Cannot deactivate the last admin user', 'error');
        return;
      }
    }

    if (!window.confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      await usersAPI.updateUser(userId, { ...userToUpdate, is_active: !isActive });
      addToast(`User ${!isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      loadUsers();
    } catch (error) {
      addToast(error.response?.data?.detail || 'Failed to update user status', 'error');
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteForm.email) {
      addToast('Email is required', 'error');
      return;
    }

    try {
      setSaving(true);
      await usersAPI.createUser({
        email: inviteForm.email,
        first_name: inviteForm.first_name,
        last_name: inviteForm.last_name,
        role: inviteForm.role,
        password: 'TempPassword123!', // In production, send invitation email
      });
      addToast('User invitation sent successfully', 'success');
      setShowInviteModal(false);
      setInviteForm({ email: '', first_name: '', last_name: '', role: 'user' });
      loadUsers();
    } catch (error) {
      addToast(error.response?.data?.detail || 'Failed to invite user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'system', label: 'System', icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-base text-slate-600">Manage system configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Organization Settings */}
      {activeTab === 'organization' && (
        <Card>
          <div className="p-6 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Organization Information</h2>
              <p className="text-sm text-slate-500 mb-6">Configure your organization details</p>
              <div className="space-y-5">
                <Input
                  label="Organization Name"
                  value={orgSettings.organization_name}
                  onChange={(e) => setOrgSettings({ ...orgSettings, organization_name: e.target.value })}
                  required
                  error={errors.organization_name}
                />
                <Input
                  label="Company Address"
                  value={orgSettings.company_address || ''}
                  onChange={(e) => setOrgSettings({ ...orgSettings, company_address: e.target.value })}
                  multiline
                  rows={3}
                  placeholder="Enter company address"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Working Schedule</h2>
              <p className="text-sm text-slate-500 mb-6">Set default working hours and days</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Working Days"
                  value={orgSettings.working_days}
                  onChange={(e) => setOrgSettings({ ...orgSettings, working_days: e.target.value })}
                >
                  <option value="mon-fri">Monday - Friday</option>
                  <option value="mon-sat">Monday - Saturday</option>
                  <option value="mon-sun">Monday - Sunday</option>
                  <option value="custom">Custom</option>
                </Select>
                <Input
                  label="Working Days per Month"
                  type="number"
                  min="1"
                  max="31"
                  value={orgSettings.working_days_per_month}
                  onChange={(e) => setOrgSettings({ ...orgSettings, working_days_per_month: parseInt(e.target.value) })}
                  error={errors.working_days_per_month}
                />
                <Input
                  label="Default Start Time"
                  type="time"
                  value={orgSettings.default_working_hours_start}
                  onChange={(e) => setOrgSettings({ ...orgSettings, default_working_hours_start: e.target.value })}
                />
                <Input
                  label="Default End Time"
                  type="time"
                  value={orgSettings.default_working_hours_end}
                  onChange={(e) => setOrgSettings({ ...orgSettings, default_working_hours_end: e.target.value })}
                />
              </div>
              {errors.working_hours && (
                <p className="text-sm text-red-600 mt-2">{errors.working_hours}</p>
              )}
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Currency Settings</h2>
              <p className="text-sm text-slate-500 mb-6">Currency configuration for payroll</p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency Code</label>
                    <Input
                      value={orgSettings.currency}
                      disabled
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
                    <Input
                      value={orgSettings.currency_symbol}
                      disabled
                      className="bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>Currency is locked to INR (₹) for payroll calculations. This setting affects all payroll records and cannot be changed.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
              <Button 
                onClick={handleSaveOrganization} 
                variant="primary" 
                disabled={saving || !isOrgDirty()}
                loading={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Users & Roles */}
      {activeTab === 'users' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">User Management</h2>
                <p className="text-sm text-slate-500">Manage users, roles, and access permissions</p>
              </div>
              <Button onClick={() => setShowInviteModal(true)} variant="primary" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
                              <span className="text-sm font-semibold text-primary-700">
                                {u.first_name?.[0] || u.username?.[0] || u.email?.[0] || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username || u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">{u.email}</td>
                        <td className="py-4 px-4">
                          <Select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className="w-36 text-sm"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="user">Employee</option>
                          </Select>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={u.is_active ? 'active' : 'inactive'} size="sm">
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowPasswordModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                u.is_active
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <Card>
          <div className="p-6 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Access Control</h2>
              <p className="text-sm text-slate-500 mb-6">Configure security and access settings</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1">Allow Self-Registration</p>
                    <p className="text-sm text-slate-500">Allow new users to create accounts without admin approval</p>
                    {systemPrefs.allow_self_registration && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Warning: This may allow unauthorized access</span>
                      </div>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={systemPrefs.allow_self_registration}
                      onChange={(e) => setSystemPrefs({ ...systemPrefs, allow_self_registration: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="p-5 border border-slate-200 rounded-lg">
                  <Input
                    label="Session Timeout (minutes)"
                    type="number"
                    min="5"
                    value={systemPrefs.session_timeout_minutes}
                    onChange={(e) => setSystemPrefs({ ...systemPrefs, session_timeout_minutes: parseInt(e.target.value) })}
                    error={errors.session_timeout}
                  />
                  <p className="text-sm text-slate-500 mt-2">Users will be automatically logged out after this period of inactivity</p>
                </div>

                <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1">Force Password Reset</p>
                    <p className="text-sm text-slate-500">Require all users to reset their password on next login</p>
                    {systemPrefs.force_password_reset && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>All users will be forced to reset passwords</span>
                      </div>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={systemPrefs.force_password_reset}
                      onChange={(e) => setSystemPrefs({ ...systemPrefs, force_password_reset: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
              <Button 
                onClick={handleSaveSystemPrefs} 
                variant="primary" 
                disabled={saving || !isSystemDirty()}
                loading={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Payroll Preferences */}
      {activeTab === 'payroll' && (
        <Card>
          <div className="p-6 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Payroll Configuration</h2>
              <p className="text-sm text-slate-500 mb-6">Configure payroll calculation rules</p>
              <div className="space-y-5">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-primary-600" />
                    <p className="font-semibold text-slate-900">Currency</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Currency Code</p>
                      <p className="text-base font-medium text-slate-900">{orgSettings.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Currency Symbol</p>
                      <p className="text-base font-medium text-slate-900">{orgSettings.currency_symbol}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">All payroll calculations use Indian Rupees (₹ INR)</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-lg">
                  <Input
                    label="Default Working Days per Month"
                    type="number"
                    min="1"
                    max="31"
                    value={orgSettings.working_days_per_month}
                    onChange={(e) => setOrgSettings({ ...orgSettings, working_days_per_month: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-slate-500 mt-2">Used as default for payroll calculations when days worked is not specified</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-lg bg-primary-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5 text-primary-600" />
                    <p className="font-semibold text-slate-900">Payroll Calculation Formula</p>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">Payroll is automatically calculated based on:</p>
                  <div className="bg-white p-4 rounded-lg border border-primary-200">
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600 font-medium">•</span>
                        <span>Base salary (₹)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600 font-medium">•</span>
                        <span>Days worked (from attendance records)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600 font-medium">•</span>
                        <span>Deductions (₹)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600 font-medium">•</span>
                        <span>Bonuses (₹)</span>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <p className="text-sm font-semibold text-slate-900">Final Pay Formula:</p>
                      <p className="text-sm text-slate-700 font-mono mt-1">
                        Final Pay = (Base Salary ÷ 30 × Days Worked) - Deductions + Bonuses
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
              <Button 
                onClick={handleSaveOrganization} 
                variant="primary" 
                disabled={saving || !isOrgDirty()}
                loading={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* System Preferences */}
      {activeTab === 'system' && (
        <Card>
          <div className="p-6 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Display & Localization</h2>
              <p className="text-sm text-slate-500 mb-6">Configure display preferences and regional settings</p>
              <div className="space-y-5">
                <Select
                  label="Theme Mode"
                  value={systemPrefs.theme_mode}
                  onChange={(e) => setSystemPrefs({ ...systemPrefs, theme_mode: e.target.value })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System Preference)</option>
                </Select>

                <Select
                  label="Date Format"
                  value={systemPrefs.date_format}
                  onChange={(e) => setSystemPrefs({ ...systemPrefs, date_format: e.target.value })}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Day/Month/Year)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (Month/Day/Year)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                </Select>

                <Input
                  label="Timezone"
                  value={systemPrefs.timezone}
                  onChange={(e) => setSystemPrefs({ ...systemPrefs, timezone: e.target.value })}
                  placeholder="e.g., Asia/Kolkata"
                />
                <p className="text-sm text-slate-500 -mt-3">Used for timestamps, logs, and reports</p>

                <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1">Enable Notifications</p>
                    <p className="text-sm text-slate-500">Show system notifications and alerts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={systemPrefs.enable_notifications}
                      onChange={(e) => setSystemPrefs({ ...systemPrefs, enable_notifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
              <Button 
                onClick={handleSaveSystemPrefs} 
                variant="primary" 
                disabled={saving || !isSystemDirty()}
                loading={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setNewPassword('');
          setSelectedUser(null);
        }}
        title="Reset Password"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Reset password for <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong> ({selectedUser?.email})
          </p>
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter new password (min 6 characters)"
          />
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setNewPassword('');
                setSelectedUser(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleResetPassword}
              className="flex-1"
            >
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteForm({ email: '', first_name: '', last_name: '', role: 'user' });
        }}
        title="Invite User"
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={inviteForm.first_name}
              onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={inviteForm.last_name}
              onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            required
            placeholder="user@example.com"
          />
          <Select
            label="Role"
            value={inviteForm.role}
            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
          >
            <option value="user">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>An invitation email will be sent to the user with instructions to set their password.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowInviteModal(false);
                setInviteForm({ email: '', first_name: '', last_name: '', role: 'user' });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Role Change Confirmation Modal */}
      <Modal
        isOpen={showRoleConfirmModal}
        onClose={() => {
          setShowRoleConfirmModal(false);
          setPendingRoleChange(null);
        }}
        title="Confirm Role Change"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900 mb-1">Are you sure you want to change this user's role?</p>
              <p className="text-sm text-amber-700">
                Changing <strong>{pendingRoleChange?.userName}</strong> from <strong>{users.find(u => u.id === pendingRoleChange?.userId)?.role}</strong> to <strong>{pendingRoleChange?.newRole}</strong> will affect their access permissions.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowRoleConfirmModal(false);
                setPendingRoleChange(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={confirmRoleChange}
              className="flex-1"
            >
              Confirm Change
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
