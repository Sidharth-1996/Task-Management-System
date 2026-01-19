from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Team, EmployeeProfile, Attendance, Payroll, OrganizationSettings, SystemPreferences
from .serializers import (
    TeamSerializer, EmployeeProfileSerializer,
    AttendanceSerializer, PayrollSerializer,
    OrganizationSettingsSerializer, SystemPreferencesSerializer
)
from .permissions import IsAdmin, IsManagerOrAdmin, IsOwnerOrManagerOrAdmin
from accounts.models import User

class TeamListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Team.objects.all().annotate(member_count=Count('employees'))
        else:
            return Team.objects.filter(manager=user).annotate(member_count=Count('employees'))

class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]
    queryset = Team.objects.all()

class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        search = self.request.query_params.get('search', None)
        status_filter = self.request.query_params.get('status', None)
        team_filter = self.request.query_params.get('team', None)
        
        if user.role == 'admin':
            queryset = EmployeeProfile.objects.select_related('user', 'team').all()
        else:
            queryset = EmployeeProfile.objects.filter(
                user__manager=user
            ).select_related('user', 'team')
        
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(position__icontains=search)
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if team_filter:
            queryset = queryset.filter(team_id=team_filter)
        
        return queryset.order_by('-date_of_joining')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only Admin can create employees.")
        serializer.save()

class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]
    queryset = EmployeeProfile.objects.all()

class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee_id = self.request.query_params.get('employee_id', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)
        
        if user.role == 'admin':
            queryset = Attendance.objects.select_related('employee__user').all()
        elif user.role == 'manager':
            # Manager sees their team's attendance
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            employee_profiles = EmployeeProfile.objects.filter(user_id__in=team_member_ids)
            queryset = Attendance.objects.filter(employee__in=employee_profiles).select_related('employee__user')
        else:
            # Employee sees only their own attendance
            try:
                employee_profile = EmployeeProfile.objects.get(user=user)
                queryset = Attendance.objects.filter(employee=employee_profile).select_related('employee__user')
            except EmployeeProfile.DoesNotExist:
                queryset = Attendance.objects.none()
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
        
        return queryset.order_by('-date')

    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user)

class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrAdmin]
    queryset = Attendance.objects.all()

class PayrollListCreateView(generics.ListCreateAPIView):
    serializer_class = PayrollSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        employee_id = self.request.query_params.get('employee_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)
        
        if user.role == 'admin':
            queryset = Payroll.objects.select_related('employee__user').all()
        else:
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            employee_profiles = EmployeeProfile.objects.filter(user_id__in=team_member_ids)
            queryset = Payroll.objects.filter(employee__in=employee_profiles).select_related('employee__user')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        if month:
            queryset = queryset.filter(month=month)
        
        if year:
            queryset = queryset.filter(year=year)
        
        return queryset.order_by('-year', '-month')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only Admin can create payroll records.")
        serializer.save()

class PayrollDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PayrollSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]
    queryset = Payroll.objects.all()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    today = timezone.now().date()
    if user.role == "admin":
        employees = EmployeeProfile.objects.filter(status='active')
        all_users = User.objects.filter(role='user')
        tasks = None
    elif user.role == "manager":
        team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
        employees = EmployeeProfile.objects.filter(user_id__in=team_member_ids, status='active')
        all_users = User.objects.filter(manager=user, role='user')
        tasks = None
    else:
        try:
            employee_profile = EmployeeProfile.objects.get(user=user)
            employees = EmployeeProfile.objects.filter(id=employee_profile.id)
            all_users = User.objects.filter(id=user.id)
            tasks = None
        except EmployeeProfile.DoesNotExist:
            employees = EmployeeProfile.objects.none()
            all_users = User.objects.none()
            tasks = None
    total_employees = employees.count()
    present_today = Attendance.objects.filter(
        employee__in=employees,
        date=today,
        status='present'
    ).count()
    on_leave_today = Attendance.objects.filter(
        employee__in=employees,
        date=today,
        status='leave'
    ).count()
    try:
        from tasks.models import Task
        if user.role == "admin":
            pending_tasks = Task.objects.exclude(status='completed').count()
        elif user.role == "manager":
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            pending_tasks = Task.objects.filter(
                Q(created_by=user) | Q(assigned_to__in=team_member_ids)
            ).exclude(status='completed').count()
        else:
            pending_tasks = Task.objects.filter(assigned_to=user).exclude(status='completed').count()
    except:
        pending_tasks = 0
    recent_employees = employees.select_related('user', 'team').order_by('-date_of_joining')[:5]
    employee_serializer = EmployeeProfileSerializer(recent_employees, many=True)
    try:
        from tasks.models import Task
        from tasks.serializers import TaskSerializer
        if user.role == "admin":
            recent_tasks = Task.objects.all().order_by('-created_at')[:5]
        elif user.role == "manager":
            team_member_ids = User.objects.filter(manager=user).values_list('id', flat=True)
            recent_tasks = Task.objects.filter(
                Q(created_by=user) | Q(assigned_to__in=team_member_ids)
            ).order_by('-created_at')[:5]
        else:
            recent_tasks = Task.objects.filter(assigned_to=user).order_by('-created_at')[:5]
        task_serializer = TaskSerializer(recent_tasks, many=True)
    except:
        task_serializer = []
    
    return Response({
        'total_employees': total_employees,
        'present_today': present_today,
        'on_leave': on_leave_today,
        'pending_tasks': pending_tasks,
        'recent_employees': employee_serializer.data,
        'recent_tasks': task_serializer if isinstance(task_serializer, list) else task_serializer.data,
    })


# Settings Views
class OrganizationSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_object(self):
        return OrganizationSettings.get_settings()


class SystemPreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = SystemPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_object(self):
        return SystemPreferences.get_preferences()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def reset_user_password(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        new_password = request.data.get('new_password', 'defaultpassword123')
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
