"""
Custom permissions for HR module
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only Admin users can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsManagerOrAdmin(permissions.BasePermission):
    """Manager or Admin can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'manager']


class IsOwnerOrManagerOrAdmin(permissions.BasePermission):
    """Owner, Manager, or Admin can access"""
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == 'admin':
            return True
        
        # Manager can access their team members
        if request.user.role == 'manager':
            if hasattr(obj, 'employee'):
                return obj.employee.user.manager == request.user
            elif hasattr(obj, 'user'):
                return obj.user.manager == request.user
            elif hasattr(obj, 'employee_profile'):
                return obj.employee_profile.user.manager == request.user
        
        # Employee can access their own data
        if hasattr(obj, 'employee'):
            return obj.employee.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'employee_profile'):
            return obj.employee_profile.user == request.user
        
        return False

