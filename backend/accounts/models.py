from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model with role-based access control.
    Supports manager-user team relationships.
    """
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("manager", "Manager"),
        ("user", "User"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    
    # Manager-User relationship: Users can be assigned to a manager
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='team_members',
        limit_choices_to={'role': 'manager'},
        help_text="Manager assigned to this user (only for users with role='user')"
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        """String representation of the user"""
        return f"{self.username} ({self.get_role_display()})"
    
    def get_team_members(self):
        """Get all users assigned to this manager (only for managers)"""
        if self.role == 'manager':
            return User.objects.filter(manager=self)
        return User.objects.none()

