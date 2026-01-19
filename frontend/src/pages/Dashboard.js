import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, UserCheck, Calendar, ClipboardList, Plus, ArrowRight } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonTableRow } from '../components/ui/Skeleton';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Employees',
      value: stats?.total_employees || 0,
      icon: Users,
      color: 'primary',
      change: null,
    },
    {
      title: 'Present Today',
      value: stats?.present_today || 0,
      icon: UserCheck,
      color: 'success',
      change: stats?.present_today ? `+${Math.round((stats.present_today / (stats.total_employees || 1)) * 100)}%` : null,
    },
    {
      title: 'On Leave',
      value: stats?.on_leave || 0,
      icon: Calendar,
      color: 'warning',
      change: stats?.on_leave ? `~${Math.round((stats.on_leave / (stats.total_employees || 1)) * 100)}%` : null,
    },
    {
      title: 'Pending Tasks',
      value: stats?.pending_tasks || 0,
      icon: ClipboardList,
      color: 'primary',
      change: null,
    },
  ];


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-base text-slate-600">Welcome back, {user?.first_name || user?.username || 'User'}</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/employees')} 
              variant="primary"
              size="md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button 
              onClick={() => navigate('/teams')} 
              variant="outline"
              size="md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            const iconBgClass = 
              kpi.color === 'primary' ? 'bg-primary-50' :
              kpi.color === 'success' ? 'bg-teal-50' :
              kpi.color === 'warning' ? 'bg-amber-50' : 'bg-slate-50';
            const iconColorClass = 
              kpi.color === 'primary' ? 'text-primary-600' :
              kpi.color === 'success' ? 'text-teal-600' :
              kpi.color === 'warning' ? 'text-amber-600' : 'text-slate-600';
            
            return (
              <Card key={index} hover className="h-full">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${iconBgClass} flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${iconColorClass}`} strokeWidth={2} />
                    </div>
                    {kpi.change && (
                      <span className={`text-sm font-semibold ${
                        kpi.change.startsWith('+') ? 'text-teal-600' : 'text-amber-600'
                      }`}>
                        {kpi.change}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-2">{kpi.title}</h3>
                  <p className="text-3xl font-bold text-slate-900">
                    <AnimatedNumber value={kpi.value} />
                  </p>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees Overview */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Employees Overview</h2>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/employees')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                )}
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SkeletonTableRow key={index} />
                  ))}
                </div>
              ) : stats?.recent_employees && stats.recent_employees.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Team</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stats.recent_employees.slice(0, 5).map((employee) => (
                          <tr
                            key={employee.id}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => navigate('/employees')}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full flex-shrink-0">
                                  <span className="text-sm font-semibold text-primary-700">
                                    {employee.user?.first_name?.[0] || employee.user?.username?.[0] || 'E'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 text-sm">
                                    {employee.user?.first_name && employee.user?.last_name
                                      ? `${employee.user.first_name} ${employee.user.last_name}`
                                      : employee.user?.name || employee.user?.username}
                                  </p>
                                  <p className="text-xs text-slate-500">{employee.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-700">{employee.position || 'Employee'}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-slate-700">{employee.team?.name || 'No Team'}</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge 
                                variant={employee.status === 'active' ? 'active' : employee.status === 'on_leave' ? 'on-leave' : 'inactive'} 
                                size="sm"
                              >
                                {employee.status_display || employee.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {stats.recent_employees.length >= 5 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <Link 
                        to="/employees" 
                        className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View all employees
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No employees found"
                  description="Get started by adding your first employee"
                  showPersonFolder={false}
                  action={
                    (user?.role === 'admin' || user?.role === 'manager') && (
                      <Button onClick={() => navigate('/employees')} variant="primary" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first employee
                      </Button>
                    )
                  }
                />
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity / Tasks */}
        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Tasks</h2>
              
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="w-3/4 h-4 bg-slate-200 rounded mb-3"></div>
                        <div className="flex items-center justify-between">
                          <div className="w-20 h-5 bg-slate-200 rounded"></div>
                          <div className="w-24 h-3 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recent_tasks && stats.recent_tasks.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <h3 className="font-semibold text-slate-900 mb-2 text-sm group-hover:text-primary-600 transition-colors">
                        {task.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assigned_to && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary-700">
                                  {task.assigned_to?.first_name?.[0] || task.assigned_to?.username?.[0] || 'U'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-600">
                                {task.assigned_to?.first_name || task.assigned_to?.username || 'Unassigned'}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={
                            task.status === 'completed' ? 'success' :
                            task.status === 'in_progress' ? 'primary' :
                            'default'
                          }
                          size="sm"
                        >
                          {task.status_display || task.status}
                        </Badge>
                      </div>
                      {task.due_date && (
                        <p className="text-xs text-slate-500 mt-2">
                          Due: {formatDate(task.due_date)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardList}
                  title="No tasks yet"
                  description="Tasks assigned to you or your team will appear here"
                  showPersonFolder={false}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
