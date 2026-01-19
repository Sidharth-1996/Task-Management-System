import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, Building2 } from 'lucide-react';
import { employeesAPI, teamsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

const Employees = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    employee_id: '',
    phone: '',
    address: '',
    date_of_joining: '',
    status: 'active',
    team_id: '',
    position: '',
    base_salary: '',
    user_data: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
    },
  });

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (teamFilter) params.team = teamFilter;
      
      const data = await employeesAPI.getEmployees(params);
      setEmployees(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      addToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, teamFilter, addToast]);

  useEffect(() => {
    loadEmployees();
    loadTeams();
  }, [loadEmployees]);

  const loadTeams = async () => {
    try {
      const data = await teamsAPI.getTeams();
      setTeams(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setFormErrors({});
    setFormData({
      employee_id: '',
      phone: '',
      address: '',
      date_of_joining: '',
      status: 'active',
      team_id: '',
      position: '',
      base_salary: '',
      user_data: {
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
      },
    });
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormErrors({});
    setFormData({
      employee_id: employee.employee_id || '',
      phone: employee.phone || '',
      address: employee.address || '',
      date_of_joining: employee.date_of_joining || '',
      status: employee.status || 'active',
      team_id: employee.team?.id || '',
      position: employee.position || '',
      base_salary: employee.base_salary || '',
      user_data: {
        username: employee.user?.username || '',
        email: employee.user?.email || '',
        password: '',
        first_name: employee.user?.first_name || '',
        last_name: employee.user?.last_name || '',
      },
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      await employeesAPI.deleteEmployee(id);
      addToast('Employee deleted successfully', 'success');
      loadEmployees();
    } catch (error) {
      addToast('Failed to delete employee', 'error');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!editingEmployee) {
      if (!formData.user_data.first_name?.trim()) {
        errors['user_data.first_name'] = 'First name is required';
      }
      if (!formData.user_data.email?.trim()) {
        errors['user_data.email'] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_data.email)) {
        errors['user_data.email'] = 'Please enter a valid email';
      }
      if (!formData.user_data.username?.trim()) {
        errors['user_data.username'] = 'Username is required';
      }
      if (!formData.user_data.password?.trim()) {
        errors['user_data.password'] = 'Password is required';
      } else if (formData.user_data.password.length < 6) {
        errors['user_data.password'] = 'Password must be at least 6 characters';
      }
    }
    
    if (!formData.employee_id?.trim()) {
      errors.employee_id = 'Employee ID is required';
    }
    if (!formData.date_of_joining) {
      errors.date_of_joining = 'Date of joining is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        employee_id: formData.employee_id,
        phone: formData.phone,
        address: formData.address,
        date_of_joining: formData.date_of_joining,
        status: formData.status,
        team_id: formData.team_id || null,
        position: formData.position,
        base_salary: formData.base_salary || 0,
      };

      if (editingEmployee) {
        await employeesAPI.updateEmployee(editingEmployee.id, payload);
        addToast('Employee updated successfully', 'success');
      } else {
        payload.user_data = formData.user_data;
        await employeesAPI.createEmployee(payload);
        addToast('Employee created successfully', 'success');
      }
      
      setShowModal(false);
      setFormErrors({});
      loadEmployees();
    } catch (error) {
      const message = error.response?.data?.detail || 
                     error.response?.data?.message ||
                     (error.response?.data && JSON.stringify(error.response.data)) ||
                     error.message || 
                     'Operation failed';
      addToast(message, 'error');
      console.error('Employee creation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-base text-slate-600">Manage your workforce and employee information</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button onClick={handleCreate} variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Filter by Role"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Filter by Role</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="">Filter by Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Employees List */}
      {employees.length === 0 ? (
        <EmptyState
          icon={User}
          title="No employees found"
          description={(user?.role === 'admin' || user?.role === 'manager') 
            ? "Get started by adding your first employee"
            : "No employees match your search criteria"}
          showPersonFolder={true}
          action={
            (user?.role === 'admin' || user?.role === 'manager') && (
              <Button onClick={handleCreate} variant="primary" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add your first employee
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Card key={employee.id} hover className="transition-all duration-200 hover:shadow-lg">
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full flex-shrink-0">
                      <span className="text-lg font-semibold text-primary-700">
                        {employee.user?.first_name?.[0] || employee.user?.username?.[0] || 'E'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {employee.user?.first_name && employee.user?.last_name
                          ? `${employee.user.first_name} ${employee.user.last_name}`
                          : employee.user?.name || employee.user?.username}
                      </h3>
                      <p className="text-sm text-slate-600 mt-0.5">{employee.position || 'Employee'}</p>
                    </div>
                  </div>
                  <Badge variant={employee.status === 'active' ? 'active' : employee.status === 'on_leave' ? 'on-leave' : 'inactive'}>
                    {employee.status_display || employee.status}
                  </Badge>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
                    <span className="truncate">{employee.user?.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.team && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" strokeWidth={2} />
                      <span>{employee.team.name}</span>
                    </div>
                  )}
                  <div className="text-sm text-slate-600">
                    Joined: {formatDate(employee.date_of_joining)}
                  </div>
                  {employee.base_salary > 0 && (
                    <div className="text-sm font-semibold text-slate-900">
                      Salary: {formatCurrency(employee.base_salary)}
                    </div>
                  )}
                </div>

                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <div className="flex gap-2 pt-5 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                      className="flex-1 hover:bg-primary-50 hover:border-primary-300"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!submitting) {
            setShowModal(false);
            setFormErrors({});
          }
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 -mr-2">
            {!editingEmployee && (
              <div className="space-y-5 pb-6 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-4">User Account</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={formData.user_data.first_name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          user_data: { ...formData.user_data, first_name: e.target.value },
                        });
                        if (formErrors['user_data.first_name']) {
                          setFormErrors({ ...formErrors, 'user_data.first_name': '' });
                        }
                      }}
                      error={formErrors['user_data.first_name']}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={formData.user_data.last_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          user_data: { ...formData.user_data, last_name: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Email"
                      type="email"
                      value={formData.user_data.email}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          user_data: { ...formData.user_data, email: e.target.value },
                        });
                        if (formErrors['user_data.email']) {
                          setFormErrors({ ...formErrors, 'user_data.email': '' });
                        }
                      }}
                      error={formErrors['user_data.email']}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input
                      label="Username"
                      value={formData.user_data.username}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          user_data: { ...formData.user_data, username: e.target.value },
                        });
                        if (formErrors['user_data.username']) {
                          setFormErrors({ ...formErrors, 'user_data.username': '' });
                        }
                      }}
                      error={formErrors['user_data.username']}
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={formData.user_data.password}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          user_data: { ...formData.user_data, password: e.target.value },
                        });
                        if (formErrors['user_data.password']) {
                          setFormErrors({ ...formErrors, 'user_data.password': '' });
                        }
                      }}
                      error={formErrors['user_data.password']}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5 pt-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Employee Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Employee ID"
                  value={formData.employee_id}
                  onChange={(e) => {
                    setFormData({ ...formData, employee_id: e.target.value });
                    if (formErrors.employee_id) {
                      setFormErrors({ ...formErrors, employee_id: '' });
                    }
                  }}
                  error={formErrors.employee_id}
                  required
                />
                <Input
                  label="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
              <Input
                label="Date of Joining"
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => {
                  setFormData({ ...formData, date_of_joining: e.target.value });
                  if (formErrors.date_of_joining) {
                    setFormErrors({ ...formErrors, date_of_joining: '' });
                  }
                }}
                error={formErrors.date_of_joining}
                required
              />
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={3}
                placeholder="Enter full address"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <Select
                  label="Team"
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                >
                  <option value="">No Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                label="Base Salary (₹)"
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                min="0"
                step="1000"
                placeholder="50000"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 -mx-6 px-6">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowModal(false);
                setFormErrors({});
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={submitting}
              disabled={submitting}
            >
              {editingEmployee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;

