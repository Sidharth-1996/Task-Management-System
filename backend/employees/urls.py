"""
URLs for HR/Employees module
"""
from django.urls import path
from .views import (
    TeamListCreateView, TeamDetailView,
    EmployeeListCreateView, EmployeeDetailView,
    AttendanceListCreateView, AttendanceDetailView,
    PayrollListCreateView, PayrollDetailView,
    dashboard_stats,
    OrganizationSettingsView, SystemPreferencesView,
    reset_user_password
)

urlpatterns = [
    # Teams
    path('teams/', TeamListCreateView.as_view(), name='team_list'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='team_detail'),
    
    # Employees
    path('employees/', EmployeeListCreateView.as_view(), name='employee_list'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee_detail'),
    
    # Attendance
    path('attendance/', AttendanceListCreateView.as_view(), name='attendance_list'),
    path('attendance/<int:pk>/', AttendanceDetailView.as_view(), name='attendance_detail'),
    
    # Payroll
    path('payroll/', PayrollListCreateView.as_view(), name='payroll_list'),
    path('payroll/<int:pk>/', PayrollDetailView.as_view(), name='payroll_detail'),
    
    # Dashboard stats
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    
    # Settings
    path('settings/organization/', OrganizationSettingsView.as_view(), name='organization_settings'),
    path('settings/preferences/', SystemPreferencesView.as_view(), name='system_preferences'),
    path('settings/users/<int:user_id>/reset-password/', reset_user_password, name='reset_user_password'),
]

