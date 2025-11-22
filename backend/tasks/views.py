from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from accounts.models import User
from .models import Task
from .serializers import TaskSerializer
from .permissions import IsManagerOrAdmin, IsOwnerOrManagerOrAdmin


class TaskListCreateView(generics.ListCreateAPIView):
    """
    View for listing and creating tasks.
    - GET: Returns tasks based on user role (Admin sees all, Manager sees team tasks, User sees own tasks)
    - POST: Creates a new task (Admin and Manager only)
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter tasks based on user role:
        - Admin: See all tasks
        - Manager: See tasks they created or assigned to their team
        - User: See only tasks assigned to them
        """
        user = self.request.user
        
        if user.role == "admin":
            # Admin can see all tasks
            queryset = Task.objects.all()
        elif user.role == "manager":
            # Manager can see tasks they created or tasks assigned to their team members
            # Get team member IDs (users assigned to this manager)
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            queryset = Task.objects.filter(
                Q(created_by=user) | Q(assigned_to__in=team_member_ids)
            ).distinct()
        else:
            # User can only see tasks assigned to them
            queryset = Task.objects.filter(assigned_to=user)
        
        # Apply search filter if provided
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        # Apply status filter if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply assigned_to filter if provided (for Admin and Manager)
        assigned_to_filter = self.request.query_params.get('assigned_to', None)
        if assigned_to_filter and user.role in ["admin", "manager"]:
            try:
                assigned_user_id = int(assigned_to_filter)
                queryset = queryset.filter(assigned_to_id=assigned_user_id)
            except (ValueError, TypeError):
                pass  # Invalid user ID, ignore filter
        
        # Order by created_at descending (newest first)
        # Return empty queryset if no tasks found (this is normal, not an error)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """
        Create a new task.
        Only Admin and Manager can create tasks.
        """
        user = self.request.user
        if user.role not in ["admin", "manager"]:
            raise permissions.PermissionDenied("Only Admin and Manager can create tasks.")
        serializer.save(created_by=user)


class TaskRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting a specific task.
    - GET: Retrieve task details (role-based access)
    - PUT/PATCH: Update task (role-based permissions)
    - DELETE: Delete task (Admin and Manager only)
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrAdmin]

    def get_queryset(self):
        """
        Filter tasks based on user role for retrieval.
        """
        user = self.request.user
        
        if user.role == "admin":
            return Task.objects.all()
        elif user.role == "manager":
            # Manager can see tasks they created or tasks assigned to their team members
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            return Task.objects.filter(
                Q(created_by=user) | Q(assigned_to__in=team_member_ids)
            ).distinct()
        else:
            return Task.objects.filter(assigned_to=user)

    def update(self, request, *args, **kwargs):
        """
        Update a task.
        - Users: Can only update status of their own assigned tasks
        - Managers: Can update tasks they created or tasks assigned to their team
        - Admins: Can update any task
        """
        user = request.user
        task = self.get_object()
        
        # Users can only update status of their assigned tasks
        if user.role == "user":
            # Check if task is assigned to this user (compare IDs to handle None case)
            if not task.assigned_to or task.assigned_to.id != user.id:
                return Response(
                    {"error": "You can only update tasks assigned to you."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Only allow status update for users - reject any other fields
            if 'status' not in request.data:
                return Response(
                    {"error": "Users can only update task status."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Check if user is trying to update other fields (not allowed)
            allowed_fields = {'status'}
            provided_fields = set(request.data.keys())
            if provided_fields - allowed_fields:
                return Response(
                    {"error": "Users can only update task status. Other fields cannot be modified."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Create a copy of request.data with only status
            # Use partial=True to allow partial updates
            data = {'status': request.data.get('status')}
            serializer = self.get_serializer(task, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        
        # Managers can only update tasks for their team
        elif user.role == "manager":
            # Get team member IDs
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            # Check if task is created by manager or assigned to a team member
            if task.created_by != user and (not task.assigned_to or task.assigned_to.id not in team_member_ids):
                return Response(
                    {"error": "You can only update tasks for your team."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Manager can update all fields for their team tasks
            kwargs['partial'] = True
            return super().update(request, *args, **kwargs)
        
        # Admins can update all fields for any task
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a task.
        - Admins: Can delete any task
        - Managers: Can only delete tasks for their team
        - Users: Cannot delete tasks
        """
        user = request.user
        task = self.get_object()
        
        # Users cannot delete tasks
        if user.role == "user":
            return Response(
                {"error": "You do not have permission to delete tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Managers can only delete tasks for their team
        if user.role == "manager":
            # Get team member IDs
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            # Check if task is created by manager or assigned to a team member
            if task.created_by != user and (not task.assigned_to or task.assigned_to.id not in team_member_ids):
                return Response(
                    {"error": "You can only delete tasks for your team."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Admin and Manager (with permission) can delete
        return super().destroy(request, *args, **kwargs)


# Calendar view endpoint
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def TaskCalendarView(request):
    """
    API endpoint for calendar view.
    Returns tasks grouped by date for calendar display.
    Filters tasks based on user role.
    """
    user = request.user
    
    # Get date range from query params (optional)
    start_date = request.query_params.get('start_date', None)
    end_date = request.query_params.get('end_date', None)
    
    # Filter tasks based on role
    if user.role == "admin":
        # Admin can see all tasks
        tasks = Task.objects.all()
    elif user.role == "manager":
        # Manager can see tasks they created or tasks assigned to their team members
        team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
        tasks = Task.objects.filter(
            Q(created_by=user) | Q(assigned_to__in=team_member_ids)
        ).distinct()
    else:
        # User can only see tasks assigned to them
        tasks = Task.objects.filter(assigned_to=user)
    
    # Filter by date range if provided (check both due_date and assigned_at)
    if start_date:
        tasks = tasks.filter(
            Q(due_date__gte=start_date) | Q(assigned_at__date__gte=start_date)
        )
    if end_date:
        tasks = tasks.filter(
            Q(due_date__lte=end_date) | Q(assigned_at__date__lte=end_date)
        )
    
    # Include tasks with either due_date or assigned_at
    tasks = tasks.filter(
        Q(due_date__isnull=False) | Q(assigned_at__isnull=False)
    )
    
    # Serialize tasks
    serializer = TaskSerializer(tasks, many=True)
    
    return Response(serializer.data)
