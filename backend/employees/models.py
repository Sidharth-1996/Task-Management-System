"""
HR Models for WorkForge HR
Employee Profile, Team, Attendance, and Payroll models
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import json


class Team(models.Model):
    """
    Team/Department model
    Represents organizational teams or departments
    """
    name = models.CharField(max_length=255, unique=True, help_text="Team name")
    description = models.TextField(blank=True, null=True, help_text="Team description")
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_teams',
        limit_choices_to={'role': 'manager'},
        help_text="Manager assigned to this team"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Team"
        verbose_name_plural = "Teams"

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        """Get number of employees in this team"""
        return self.employees.count()


class EmployeeProfile(models.Model):
    """
    Extended employee profile
    Links to User and contains HR-specific information
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('inactive', 'Inactive'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        help_text="Associated user account"
    )
    employee_id = models.CharField(max_length=50, unique=True, help_text="Unique employee ID")
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_joining = models.DateField(help_text="Date when employee joined")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    team = models.ForeignKey(
        Team,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees',
        help_text="Team/Department assignment"
    )
    position = models.CharField(max_length=255, blank=True, null=True, help_text="Job position/title")
    base_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Base salary in INR (₹)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_of_joining']
        verbose_name = "Employee Profile"
        verbose_name_plural = "Employee Profiles"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.employee_id}"


class Attendance(models.Model):
    """
    Daily attendance record
    Tracks employee attendance on a daily basis
    """
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('leave', 'On Leave'),
    )

    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        help_text="Employee for this attendance record"
    )
    date = models.DateField(help_text="Attendance date")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    check_in = models.TimeField(null=True, blank=True, help_text="Check-in time")
    check_out = models.TimeField(null=True, blank=True, help_text="Check-out time")
    notes = models.TextField(blank=True, null=True, help_text="Additional notes")
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_attendances',
        help_text="User who marked this attendance (for admin override)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']
        verbose_name = "Attendance"
        verbose_name_plural = "Attendance Records"

    def __str__(self):
        return f"{self.employee.user.username} - {self.date} - {self.get_status_display()}"


class Payroll(models.Model):
    """
    Payroll record
    Monthly payroll calculation and records
    """
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name='payroll_records',
        help_text="Employee for this payroll record"
    )
    month = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)], help_text="Month (1-12)")
    year = models.IntegerField(help_text="Year")
    base_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Base salary in INR (₹)"
    )
    days_worked = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Number of days worked")
    days_present = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Days present")
    days_absent = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Days absent")
    days_on_leave = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Days on leave")
    deductions = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Deductions in INR (₹)"
    )
    bonuses = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Bonuses in INR (₹)"
    )
    final_pay = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Final payable amount in INR (₹)"
    )
    status = models.CharField(
        max_length=20,
        choices=[('draft', 'Draft'), ('processed', 'Processed'), ('paid', 'Paid')],
        default='draft'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'month', 'year']
        ordering = ['-year', '-month']
        verbose_name = "Payroll"
        verbose_name_plural = "Payroll Records"

    def __str__(self):
        return f"{self.employee.user.username} - {self.month}/{self.year} - ₹{self.final_pay}"

    def calculate_final_pay(self):
        """Calculate final payable amount"""
        daily_rate = self.base_salary / 30  # Assuming 30 days per month
        earned_salary = daily_rate * self.days_worked
        final = earned_salary - self.deductions + self.bonuses
        return max(Decimal('0.00'), final)

    def save(self, *args, **kwargs):
        """Auto-calculate final pay before saving"""
        if not self.final_pay or self.final_pay == 0:
            self.final_pay = self.calculate_final_pay()
        super().save(*args, **kwargs)


class OrganizationSettings(models.Model):
    """
    Organization-level settings
    Singleton model for organization configuration
    """
    organization_name = models.CharField(max_length=255, default="WorkForge HR", help_text="Organization name")
    organization_logo = models.FileField(upload_to='logos/', null=True, blank=True, help_text="Organization logo")
    company_address = models.TextField(blank=True, null=True, help_text="Company address")
    working_days = models.CharField(
        max_length=50,
        default="mon-fri",
        choices=[
            ('mon-fri', 'Monday - Friday'),
            ('mon-sat', 'Monday - Saturday'),
            ('mon-sun', 'Monday - Sunday'),
            ('custom', 'Custom'),
        ],
        help_text="Default working days"
    )
    custom_working_days = models.JSONField(default=list, blank=True, help_text="Custom working days (if custom selected)")
    default_working_hours_start = models.TimeField(default='09:00', help_text="Default work start time")
    default_working_hours_end = models.TimeField(default='18:00', help_text="Default work end time")
    currency = models.CharField(max_length=10, default='INR', help_text="Currency code")
    currency_symbol = models.CharField(max_length=5, default='₹', help_text="Currency symbol")
    working_days_per_month = models.IntegerField(default=26, validators=[MinValueValidator(1), MaxValueValidator(31)], help_text="Default working days per month")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Organization Settings"
        verbose_name_plural = "Organization Settings"

    def __str__(self):
        return f"Organization Settings - {self.organization_name}"

    @classmethod
    def get_settings(cls):
        """Get or create organization settings (singleton pattern)"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


class SystemPreferences(models.Model):
    """
    System-wide preferences
    Singleton model for system configuration
    """
    allow_self_registration = models.BooleanField(default=False, help_text="Allow users to self-register")
    session_timeout_minutes = models.IntegerField(default=60, validators=[MinValueValidator(5)], help_text="Session timeout in minutes")
    force_password_reset = models.BooleanField(default=False, help_text="Force password reset on next login")
    theme_mode = models.CharField(
        max_length=10,
        default='light',
        choices=[('light', 'Light'), ('dark', 'Dark'), ('auto', 'Auto')],
        help_text="Theme mode"
    )
    date_format = models.CharField(
        max_length=20,
        default='DD/MM/YYYY',
        choices=[
            ('DD/MM/YYYY', 'DD/MM/YYYY'),
            ('MM/DD/YYYY', 'MM/DD/YYYY'),
            ('YYYY-MM-DD', 'YYYY-MM-DD'),
        ],
        help_text="Date format"
    )
    timezone = models.CharField(max_length=50, default='Asia/Kolkata', help_text="Timezone")
    enable_notifications = models.BooleanField(default=True, help_text="Enable system notifications")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Preferences"
        verbose_name_plural = "System Preferences"

    def __str__(self):
        return "System Preferences"

    @classmethod
    def get_preferences(cls):
        """Get or create system preferences (singleton pattern)"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
