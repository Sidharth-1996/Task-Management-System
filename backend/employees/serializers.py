"""
Serializers for HR models
"""
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from accounts.models import User
from accounts.serializers import UserSerializer
from .models import Team, EmployeeProfile, Attendance, Payroll, OrganizationSettings, SystemPreferences


class TeamSerializer(serializers.ModelSerializer):
    """Serializer for Team model"""
    manager = UserSerializer(read_only=True)
    manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'manager', 'manager_id', 'member_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        manager_id = validated_data.pop('manager_id', None)
        team = Team.objects.create(**validated_data)
        if manager_id:
            try:
                manager = User.objects.get(id=manager_id, role='manager')
                team.manager = manager
                team.save()
            except User.DoesNotExist:
                pass
        return team

    def update(self, instance, validated_data):
        manager_id = validated_data.pop('manager_id', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if manager_id is not None:
            if manager_id:
                try:
                    manager = User.objects.get(id=manager_id, role='manager')
                    instance.manager = manager
                except User.DoesNotExist:
                    pass
            else:
                instance.manager = None
        
        instance.save()
        return instance


class EmployeeProfileSerializer(serializers.ModelSerializer):
    """Serializer for EmployeeProfile"""
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    team = TeamSerializer(read_only=True)
    team_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user', 'user_id', 'user_data', 'employee_id', 'phone', 'address',
            'date_of_joining', 'status', 'status_display', 'team', 'team_id',
            'position', 'base_salary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'user_data': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        user_id = validated_data.pop('user_id', None)
        team_id = validated_data.pop('team_id', None)
        user_data = validated_data.pop('user_data', None)
        
        if user_id:
            user = User.objects.get(id=user_id)
        elif user_data:
            # Create user from user_data
            username = user_data.get('username') or user_data.get('email')
            if not username:
                raise serializers.ValidationError({"user_data": "Username or email is required"})
            user = User.objects.create_user(
                username=username,
                email=user_data.get('email'),
                password=user_data.get('password', 'defaultpassword123'),
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                role='user'
            )
        else:
            raise serializers.ValidationError({"user_data": "Either user_id or user_data must be provided"})
        
        profile = EmployeeProfile.objects.create(user=user, **validated_data)
        
        if team_id:
            try:
                team = Team.objects.get(id=team_id)
                profile.team = team
                profile.save()
            except Team.DoesNotExist:
                pass
        
        return profile


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance"""
    employee = EmployeeProfileSerializer(read_only=True)
    employee_id = serializers.IntegerField(write_only=True)
    marked_by = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_id', 'date', 'status', 'status_display',
            'check_in', 'check_out', 'notes', 'marked_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'marked_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id')
        employee = EmployeeProfile.objects.get(id=employee_id)
        attendance = Attendance.objects.create(
            employee=employee,
            marked_by=self.context['request'].user,
            **validated_data
        )
        return attendance


class PayrollSerializer(serializers.ModelSerializer):
    """Serializer for Payroll"""
    employee = EmployeeProfileSerializer(read_only=True)
    employee_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_id', 'month', 'year', 'base_salary',
            'days_worked', 'days_present', 'days_absent', 'days_on_leave',
            'deductions', 'bonuses', 'final_pay', 'status', 'status_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'final_pay', 'created_at', 'updated_at']

    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id')
        employee = EmployeeProfile.objects.get(id=employee_id)
        payroll = Payroll.objects.create(employee=employee, **validated_data)
        return payroll


class OrganizationSettingsSerializer(serializers.ModelSerializer):
    """Serializer for OrganizationSettings"""
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationSettings
        fields = [
            'id', 'organization_name', 'organization_logo', 'logo_url',
            'company_address', 'working_days', 'custom_working_days',
            'default_working_hours_start', 'default_working_hours_end',
            'currency', 'currency_symbol', 'working_days_per_month',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_logo_url(self, obj):
        if obj.organization_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.organization_logo.url)
            return obj.organization_logo.url
        return None


class SystemPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for SystemPreferences"""

    class Meta:
        model = SystemPreferences
        fields = [
            'id', 'allow_self_registration', 'session_timeout_minutes',
            'force_password_reset', 'theme_mode', 'date_format', 'timezone',
            'enable_notifications', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

