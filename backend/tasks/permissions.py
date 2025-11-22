from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Permission class to check if user is an Admin.
    Only Admin users have permission.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsManagerOrAdmin(BasePermission):
    """
    Permission class to check if user is Manager or Admin.
    Both Manager and Admin users have permission.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "manager"]

class IsOwnerOrManagerOrAdmin(BasePermission):
    """
    Permission class to check if user owns the resource or is Manager/Admin.
    Users can access their own resources, Managers and Admins can access all.
    """
    def has_object_permission(self, request, view, obj):
        # Admin and Manager can access all tasks
        if request.user.role in ["admin", "manager"]:
            return True
        # Users can only access tasks assigned to them
        if hasattr(obj, 'assigned_to'):
            # Compare IDs to handle None case and ensure proper comparison
            return obj.assigned_to and obj.assigned_to.id == request.user.id
        return False
