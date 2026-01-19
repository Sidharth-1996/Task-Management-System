from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from accounts.models import User
from .models import Task
from .serializers import TaskSerializer
from .permissions import IsManagerOrAdmin, IsOwnerOrManagerOrAdmin


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            queryset = Task.objects.all()
        elif user.role == "manager":
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            queryset = Task.objects.filter(
                Q(created_by=user) | Q(assigned_to__in=team_member_ids)
            ).distinct()
        else:
            queryset = Task.objects.filter(assigned_to=user)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        assigned_to_filter = self.request.query_params.get('assigned_to', None)
        if assigned_to_filter and user.role in ["admin", "manager"]:
            try:
                assigned_user_id = int(assigned_to_filter)
                queryset = queryset.filter(assigned_to_id=assigned_user_id)
            except (ValueError, TypeError):
                pass
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ["admin", "manager"]:
            raise permissions.PermissionDenied("Only Admin and Manager can create tasks.")
        serializer.save(created_by=user)


class TaskRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Task.objects.all()
        elif user.role == "manager":
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            return Task.objects.filter(
                Q(created_by=user) | Q(assigned_to__in=team_member_ids)
            ).distinct()
        else:
            return Task.objects.filter(assigned_to=user)

    def update(self, request, *args, **kwargs):
        user = request.user
        task = self.get_object()
        if user.role == "user":
            if not task.assigned_to or task.assigned_to.id != user.id:
                return Response(
                    {"error": "You can only update tasks assigned to you."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if 'status' not in request.data:
                return Response(
                    {"error": "Users can only update task status."},
                    status=status.HTTP_403_FORBIDDEN
                )
            allowed_fields = {'status'}
            provided_fields = set(request.data.keys())
            if provided_fields - allowed_fields:
                return Response(
                    {"error": "Users can only update task status. Other fields cannot be modified."},
                    status=status.HTTP_403_FORBIDDEN
                )
            data = {'status': request.data.get('status')}
            serializer = self.get_serializer(task, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        elif user.role == "manager":
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            if task.created_by != user and (not task.assigned_to or task.assigned_to.id not in team_member_ids):
                return Response(
                    {"error": "You can only update tasks for your team."},
                    status=status.HTTP_403_FORBIDDEN
                )
            kwargs['partial'] = True
            return super().update(request, *args, **kwargs)
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        task = self.get_object()
        if user.role == "user":
            return Response(
                {"error": "You do not have permission to delete tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
        if user.role == "manager":
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            if task.created_by != user and (not task.assigned_to or task.assigned_to.id not in team_member_ids):
                return Response(
                    {"error": "You can only delete tasks for your team."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().destroy(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def TaskCalendarView(request):
    user = request.user
    start_date = request.query_params.get('start_date', None)
    end_date = request.query_params.get('end_date', None)
    if user.role == "admin":
        tasks = Task.objects.all()
    elif user.role == "manager":
        team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
        tasks = Task.objects.filter(
            Q(created_by=user) | Q(assigned_to__in=team_member_ids)
        ).distinct()
    else:
        tasks = Task.objects.filter(assigned_to=user)
    if start_date:
        tasks = tasks.filter(
            Q(due_date__gte=start_date) | Q(assigned_at__date__gte=start_date)
        )
    if end_date:
        tasks = tasks.filter(
            Q(due_date__lte=end_date) | Q(assigned_at__date__lte=end_date)
        )
    tasks = tasks.filter(
        Q(due_date__isnull=False) | Q(assigned_at__isnull=False)
    )
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)
