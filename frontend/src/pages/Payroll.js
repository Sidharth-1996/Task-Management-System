import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, FileText, IndianRupee } from 'lucide-react';
import { payrollAPI, employeesAPI, attendanceAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonTableRow } from '../components/ui/Skeleton';

const Payroll = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [bulkPayrollData, setBulkPayrollData] = useState({});
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const loadPayroll = useCallback(async () => {
    try {
      setLoading(true);
      const params = { month: selectedMonth, year: selectedYear };
      const data = await payrollAPI.getPayroll(params);
      setPayrolls(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      addToast('Failed to load payroll', 'error');
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, addToast]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await employeesAPI.getEmployees({ status: 'active' });
      setEmployees(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
    }
  }, []);

  const loadAttendanceForMonth = useCallback(async () => {
    try {
      const params = { month: selectedMonth, year: selectedYear };
      const data = await attendanceAPI.getAttendance(params);
      const attendance = Array.isArray(data) ? data : data.results || [];
      
      const grouped = {};
      attendance.forEach(record => {
        const empId = record.employee?.id;
        if (!empId) return;
        
        if (!grouped[empId]) {
          grouped[empId] = {
            days_present: 0,
            days_absent: 0,
            days_on_leave: 0,
            days_worked: 0,
          };
        }
        
        if (record.status === 'present') {
          grouped[empId].days_present++;
          grouped[empId].days_worked++;
        } else if (record.status === 'absent') {
          grouped[empId].days_absent++;
        } else if (record.status === 'leave' || record.status === 'on_leave') {
          grouped[empId].days_on_leave++;
        } else if (record.status === 'half_day') {
          grouped[empId].days_worked += 0.5;
        }
      });
      
      setAttendanceData(grouped);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendanceData({});
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadPayroll();
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadEmployees();
      loadAttendanceForMonth();
    }
  }, [loadPayroll, loadEmployees, loadAttendanceForMonth, user?.role]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const calculateFinalPay = (baseSalary, daysWorked, deductions, bonuses) => {
    const dailyRate = baseSalary / 30;
    const earnedSalary = dailyRate * daysWorked;
    return Math.max(0, earnedSalary - deductions + bonuses);
  };

  const handleCreate = () => {
    setEditingPayroll(null);
    const initialData = {};
    employees.forEach(emp => {
      const attendance = attendanceData[emp.id] || {};
      const baseSalary = parseFloat(emp.base_salary) || 0;
      const daysWorked = attendance.days_worked || 0;
      const deductions = 0;
      const bonuses = 0;
      const finalPay = calculateFinalPay(baseSalary, daysWorked, deductions, bonuses);
      
      initialData[emp.id] = {
        base_salary: baseSalary,
        days_worked: daysWorked,
        days_present: attendance.days_present || 0,
        days_absent: attendance.days_absent || 0,
        days_on_leave: attendance.days_on_leave || 0,
        deductions: deductions,
        bonuses: bonuses,
        final_pay: finalPay,
        status: 'draft',
      };
    });
    setBulkPayrollData(initialData);
    setShowModal(true);
  };

  const handleEdit = (payroll) => {
    setEditingPayroll(payroll);
    setBulkPayrollData({
      [payroll.employee.id]: {
        base_salary: parseFloat(payroll.base_salary) || 0,
        days_worked: payroll.days_worked || 0,
        days_present: payroll.days_present || 0,
        days_absent: payroll.days_absent || 0,
        days_on_leave: payroll.days_on_leave || 0,
        deductions: parseFloat(payroll.deductions) || 0,
        bonuses: parseFloat(payroll.bonuses) || 0,
        status: payroll.status || 'draft',
      },
    });
    setShowModal(true);
  };

  const handleBulkFieldChange = (employeeId, field, value) => {
    setBulkPayrollData(prev => {
      const updated = { ...prev };
      if (!updated[employeeId]) {
        updated[employeeId] = {
          base_salary: 0,
          days_worked: 0,
          deductions: 0,
          bonuses: 0,
          status: 'draft',
        };
      }
      
      updated[employeeId][field] = field === 'status' ? value : parseFloat(value) || 0;
      
      // Auto-calculate final pay whenever relevant fields change
      const data = updated[employeeId];
      if (data.base_salary !== undefined && data.days_worked !== undefined) {
        data.final_pay = calculateFinalPay(
          data.base_salary || 0,
          data.days_worked || 0,
          data.deductions || 0,
          data.bonuses || 0
        );
      }
      
      return updated;
    });
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const records = Object.entries(bulkPayrollData).map(([employeeId, data]) => ({
        employee_id: parseInt(employeeId),
        month: selectedMonth,
        year: selectedYear,
        base_salary: data.base_salary || 0,
        days_worked: data.days_worked || 0,
        days_present: data.days_present || 0,
        days_absent: data.days_absent || 0,
        days_on_leave: data.days_on_leave || 0,
        deductions: data.deductions || 0,
        bonuses: data.bonuses || 0,
        status: data.status || 'draft',
      }));

      if (editingPayroll) {
        // Update single payroll
        await payrollAPI.updatePayroll(editingPayroll.id, records[0]);
        addToast('Payroll updated successfully', 'success');
      } else {
        // Bulk create/update payroll records
        const promises = records.map(record => {
          const existing = payrolls.find(p => 
            p.employee?.id === record.employee_id && 
            p.month === record.month && 
            p.year === record.year
          );
          if (existing) {
            return payrollAPI.updatePayroll(existing.id, record);
          } else {
            return payrollAPI.createPayroll(record);
          }
        });
        await Promise.all(promises);
        addToast('Payroll generated successfully', 'success');
      }
      
      setShowModal(false);
      setBulkPayrollData({});
      loadPayroll();
    } catch (error) {
      addToast(error.response?.data?.detail || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSlip = async (payrollId) => {
    try {
      // In a real app, this would generate/download a PDF
      addToast('Payslip generation coming soon', 'info');
    } catch (error) {
      addToast('Failed to generate payslip', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="paid" size="sm">Paid</Badge>;
      case 'processed':
        return <Badge variant="processed" size="sm">Processed</Badge>;
      case 'pending':
      case 'draft':
        return <Badge variant="pending" size="sm">{status === 'draft' ? 'Draft' : 'Pending'}</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payroll</h1>
          <p className="text-base text-slate-600">Manage employee payroll and salaries</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={handleCreate} variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Create Payroll
          </Button>
        )}
      </div>

      {/* Filters Card */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
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
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
            />
          </div>
        </div>
      </Card>

      {/* Payroll Table */}
      <Card>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonTableRow key={index} />
              ))}
            </div>
          ) : payrolls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Base Salary (₹)</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Days Worked</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Deductions (₹)</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Bonuses (₹)</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Final Pay (₹)</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    {user?.role === 'admin' && (
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full flex-shrink-0">
                            <span className="text-sm font-semibold text-primary-700">
                              {payroll.employee?.user?.first_name?.[0] || payroll.employee?.user?.username?.[0] || 'E'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {payroll.employee?.user?.first_name && payroll.employee?.user?.last_name
                                ? `${payroll.employee.user.first_name} ${payroll.employee.user.last_name}`
                                : payroll.employee?.user?.name || payroll.employee?.user?.username}
                            </p>
                            <p className="text-xs text-slate-500">{payroll.employee?.position || 'Employee'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-900">{formatCurrency(payroll.base_salary)}</td>
                      <td className="py-4 px-4 text-slate-700">{payroll.days_worked}</td>
                      <td className="py-4 px-4 text-red-600">{formatCurrency(payroll.deductions)}</td>
                      <td className="py-4 px-4 text-teal-600">{formatCurrency(payroll.bonuses)}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(payroll.final_pay)}</td>
                      <td className="py-4 px-4">
                        {getStatusBadge(payroll.status)}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleGenerateSlip(payroll.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                              aria-label="Generate payslip"
                              title="Generate Payslip"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(payroll)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                              aria-label="Edit payroll"
                              title="Edit"
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
              icon={IndianRupee}
              title="No payroll records found"
              description="Create payroll for this month to get started"
              showPersonFolder={false}
              action={
                user?.role === 'admin' && (
                  <Button onClick={handleCreate} variant="primary" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Payroll
                  </Button>
                )
              }
            />
          )}
        </div>
      </Card>

      {/* Create/Edit Payroll Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          if (!saving) {
            setShowModal(false);
            setEditingPayroll(null);
            setBulkPayrollData({});
          }
        }}
        title={editingPayroll ? 'Edit Payroll' : 'Create Payroll'}
        size="xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-6">
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              Period: <span className="font-medium text-slate-900">{monthNames[selectedMonth - 1]} {selectedYear}</span>
            </p>
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 -mr-2">
            {editingPayroll ? (
              // Single employee edit mode
              (() => {
                const emp = editingPayroll.employee;
                const data = bulkPayrollData[emp.id] || {};
                return (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
                        <span className="text-base font-semibold text-primary-700">
                          {emp.user?.first_name?.[0] || emp.user?.username?.[0] || 'E'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {emp.user?.first_name && emp.user?.last_name
                            ? `${emp.user.first_name} ${emp.user.last_name}`
                            : emp.user?.name || emp.user?.username}
                        </p>
                        <p className="text-sm text-slate-600">{emp.position || 'Employee'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Base Salary (₹)"
                        type="number"
                        value={data.base_salary || 0}
                        onChange={(e) => handleBulkFieldChange(emp.id, 'base_salary', e.target.value)}
                        required
                        min="0"
                        step="1000"
                      />
                      <Input
                        label="Days Worked"
                        type="number"
                        value={data.days_worked || 0}
                        onChange={(e) => handleBulkFieldChange(emp.id, 'days_worked', e.target.value)}
                        min="0"
                        step="0.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Deductions (₹)"
                        type="number"
                        value={data.deductions || 0}
                        onChange={(e) => handleBulkFieldChange(emp.id, 'deductions', e.target.value)}
                        min="0"
                        step="100"
                      />
                      <Input
                        label="Bonuses (₹)"
                        type="number"
                        value={data.bonuses || 0}
                        onChange={(e) => handleBulkFieldChange(emp.id, 'bonuses', e.target.value)}
                        min="0"
                        step="100"
                      />
                    </div>

                    {(() => {
                      const baseSalary = data.base_salary !== undefined ? data.base_salary : 0;
                      const daysWorked = data.days_worked !== undefined ? data.days_worked : 0;
                      const deductions = data.deductions !== undefined ? data.deductions : 0;
                      const bonuses = data.bonuses !== undefined ? data.bonuses : 0;
                      const finalPay = calculateFinalPay(baseSalary, daysWorked, deductions, bonuses);
                      
                      return (
                        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Final Pay:</span>
                            <span className="text-lg font-bold text-primary-700">
                              {formatCurrency(finalPay)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <Select
                      label="Status"
                      value={data.status || 'draft'}
                      onChange={(e) => handleBulkFieldChange(emp.id, 'status', e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="processed">Processed</option>
                      <option value="paid">Paid</option>
                    </Select>
                  </div>
                );
              })()
            ) : (
              // Bulk create mode
              <div className="space-y-4">
                {employees.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No employees available</p>
                  </div>
                ) : (
                  employees.map((emp) => {
                    const data = bulkPayrollData[emp.id] || {};
                    const attendance = attendanceData[emp.id] || {};
                    
                    return (
                      <div
                        key={emp.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full flex-shrink-0">
                            <span className="text-sm font-semibold text-primary-700">
                              {emp.user?.first_name?.[0] || emp.user?.username?.[0] || 'E'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">
                              {emp.user?.first_name && emp.user?.last_name
                                ? `${emp.user.first_name} ${emp.user.last_name}`
                                : emp.user?.name || emp.user?.username}
                            </p>
                            <p className="text-xs text-slate-500">{emp.position || 'Employee'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Base Salary (₹)"
                            type="number"
                            value={data.base_salary !== undefined ? data.base_salary : (emp.base_salary || 0)}
                            onChange={(e) => handleBulkFieldChange(emp.id, 'base_salary', e.target.value)}
                            min="0"
                            step="1000"
                          />
                          <Input
                            label="Days Worked"
                            type="number"
                            value={data.days_worked !== undefined ? data.days_worked : (attendance.days_worked || 0)}
                            onChange={(e) => handleBulkFieldChange(emp.id, 'days_worked', e.target.value)}
                            min="0"
                            step="0.5"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <Input
                            label="Deductions (₹)"
                            type="number"
                            value={data.deductions !== undefined ? data.deductions : 0}
                            onChange={(e) => handleBulkFieldChange(emp.id, 'deductions', e.target.value)}
                            min="0"
                            step="100"
                          />
                          <Input
                            label="Bonuses (₹)"
                            type="number"
                            value={data.bonuses !== undefined ? data.bonuses : 0}
                            onChange={(e) => handleBulkFieldChange(emp.id, 'bonuses', e.target.value)}
                            min="0"
                            step="100"
                          />
                        </div>

                        {(() => {
                          const baseSalary = data.base_salary !== undefined ? data.base_salary : (emp.base_salary || 0);
                          const daysWorked = data.days_worked !== undefined ? data.days_worked : (attendance.days_worked || 0);
                          const deductions = data.deductions !== undefined ? data.deductions : 0;
                          const bonuses = data.bonuses !== undefined ? data.bonuses : 0;
                          const finalPay = calculateFinalPay(baseSalary, daysWorked, deductions, bonuses);
                          
                          return (
                            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600">Final Pay:</span>
                                <span className="text-sm font-bold text-slate-900">
                                  {formatCurrency(finalPay)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                )}
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
                setEditingPayroll(null);
                setBulkPayrollData({});
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
              {editingPayroll ? 'Update Payroll' : 'Generate Payroll'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payroll;

