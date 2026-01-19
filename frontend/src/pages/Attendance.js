import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, Edit, UserCheck } from 'lucide-react';
import { attendanceAPI, employeesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import Calendar from '../components/ui/Calendar';
import { SkeletonTableRow } from '../components/ui/Skeleton';

const Attendance = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [bulkAttendance, setBulkAttendance] = useState({});
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        month: selectedMonth,
        year: selectedYear,
      };
      const data = await attendanceAPI.getAttendance(params);
      const allAttendance = Array.isArray(data) ? data : data.results || [];
      setAttendance(allAttendance);
    } catch (error) {
      addToast('Failed to load attendance', 'error');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, addToast]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await employeesAPI.getEmployees();
      setEmployees(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadEmployees();
    }
  }, [loadAttendance, loadEmployees, user?.role]);

  // Update selected month/year when date changes (but don't trigger loadAttendance)
  useEffect(() => {
    const date = new Date(selectedDate);
    const newMonth = date.getMonth() + 1;
    const newYear = date.getFullYear();
    
    if (newMonth !== selectedMonth || newYear !== selectedYear) {
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
    }
  }, [selectedDate, selectedMonth, selectedYear]);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach(record => {
      const dateKey = record.date;
      map[dateKey] = { status: record.status };
    });
    return map;
  }, [attendance]);

  const selectedDateAttendance = useMemo(() => {
    return attendance.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === selectedDate;
    });
  }, [attendance, selectedDate]);

  const handleMarkAttendance = () => {
    setEditingRecord(null);
    const initialBulk = {};
    selectedDateAttendance.forEach(record => {
      if (record.employee?.id) {
        initialBulk[record.employee.id] = record.status;
      }
    });
    employees.forEach(emp => {
      if (!initialBulk[emp.id]) {
        initialBulk[emp.id] = 'present';
      }
    });
    setBulkAttendance(initialBulk);
    setShowModal(true);
  };

  const handleBulkStatusChange = (employeeId, status) => {
    setBulkAttendance(prev => ({
      ...prev,
      [employeeId]: status,
    }));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const records = Object.entries(bulkAttendance).map(([employeeId, status]) => ({
        employee_id: parseInt(employeeId),
        date: selectedDate,
        status: status,
      }));

      const promises = records.map(record => {
        const existing = selectedDateAttendance.find(a => a.employee?.id === parseInt(record.employee_id));
        if (existing) {
          return attendanceAPI.updateAttendance(existing.id, { status: record.status });
        } else {
          return attendanceAPI.createAttendance(record);
        }
      });

      await Promise.all(promises);
      addToast('Attendance saved successfully', 'success');
      setShowModal(false);
      loadAttendance();
    } catch (error) {
      addToast(error.response?.data?.detail || 'Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setBulkAttendance({
      [record.employee?.id]: record.status,
    });
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge variant="success" size="sm">Present</Badge>;
      case 'absent':
        return <Badge variant="danger" size="sm">Absent</Badge>;
      case 'leave':
      case 'on_leave':
        return <Badge variant="warning" size="sm">On Leave</Badge>;
      case 'half_day':
        return <Badge variant="warning" size="sm">Half Day</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-base text-slate-600">Track employee attendance</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button onClick={handleMarkAttendance} variant="primary" size="md">
            <UserCheck className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        )}
      </div>

      {/* Filters Card */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => {
                const month = parseInt(e.target.value);
                setSelectedMonth(month);
                // Update date to first of selected month
                const newDate = new Date(selectedYear, month - 1, 1);
                setSelectedDate(newDate.toISOString().split('T')[0]);
              }}
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </Select>
            <Input
              label="Year"
              type="number"
              value={selectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                setSelectedYear(year);
                // Update date to maintain day in new year
                const date = new Date(selectedDate);
                date.setFullYear(year);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              min="2020"
              max="2030"
            />
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Table */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Attendance for {formatDateDisplay(selectedDate)}
                </h2>
                {selectedDateAttendance.length > 0 && (
                  <span className="text-sm text-slate-500">
                    Showing {selectedDateAttendance.length} of {employees.length}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonTableRow key={index} />
                  ))}
                </div>
              ) : selectedDateAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDateAttendance.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full flex-shrink-0">
                                <span className="text-sm font-semibold text-primary-700">
                                  {record.employee?.user?.first_name?.[0] || record.employee?.user?.username?.[0] || 'E'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">
                                  {record.employee?.user?.first_name && record.employee?.user?.last_name
                                    ? `${record.employee.user.first_name} ${record.employee.user.last_name}`
                                    : record.employee?.user?.name || record.employee?.user?.username}
                                </p>
                                <p className="text-xs text-slate-500">{record.employee?.position || 'Employee'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(record.status)}
                          </td>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end">
                                <button
                                  onClick={() => handleEdit(record)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                                  aria-label="Edit attendance"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={CalendarIcon}
                  title="No attendance records found"
                  description="Select a date to begin tracking attendance"
                  showPersonFolder={false}
                  action={
                    (user?.role === 'admin' || user?.role === 'manager') && (
                      <Button onClick={handleMarkAttendance} variant="primary" className="mt-4">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Mark Attendance
                      </Button>
                    )
                  }
                />
              )}
            </div>
          </Card>
        </div>

        {/* Calendar Widget */}
        <div className="lg:col-span-1">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            attendanceData={attendanceMap}
          />
        </div>
      </div>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!saving) {
            setShowModal(false);
            setEditingRecord(null);
            setBulkAttendance({});
          }
        }}
        title={editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
        size="lg"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-6">
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-4">
              Date: <span className="font-medium text-slate-900">{formatDateDisplay(selectedDate)}</span>
            </p>
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 -mr-2">
            {employees.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No employees available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(editingRecord ? [editingRecord.employee] : employees).map((employee) => {
                  const employeeId = employee.id;
                  const currentStatus = bulkAttendance[employeeId] || (editingRecord ? editingRecord.status : 'present');
                  
                  return (
                    <div
                      key={employeeId}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full flex-shrink-0">
                          <span className="text-sm font-semibold text-primary-700">
                            {employee.user?.first_name?.[0] || employee.user?.username?.[0] || 'E'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {employee.user?.first_name && employee.user?.last_name
                              ? `${employee.user.first_name} ${employee.user.last_name}`
                              : employee.user?.name || employee.user?.username}
                          </p>
                          <p className="text-xs text-slate-500">{employee.position || 'Employee'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={currentStatus}
                          onChange={(e) => handleBulkStatusChange(employeeId, e.target.value)}
                          className="w-32"
                          disabled={saving}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="leave">On Leave</option>
                          <option value="half_day">Half Day</option>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 -mx-6 px-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEditingRecord(null);
                setBulkAttendance({});
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              {editingRecord ? 'Update Attendance' : 'Save Attendance'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;

