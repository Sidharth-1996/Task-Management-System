"""
Task Model
Defines the Task model with all required fields and relationships
"""
from django.db import models
from django.conf import settings


class Task(models.Model):
    """
    Task model representing tasks in the system.
    Tasks can be assigned to users and have various statuses.
    """
    # Status choices for tasks
    STATUS_CHOICES = (
        ("todo", "To Do"),
        ("inprogress", "In Progress"),
        ("completed", "Completed"),
    )

    # Task fields
    title = models.CharField(max_length=255, help_text="Task title")
    description = models.TextField(blank=True, null=True, help_text="Task description")
    
    # User relationships
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="assigned_tasks",
        help_text="User assigned to this task"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="created_tasks",
        help_text="User who created this task"
    )

    # Task status and dates
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="todo",
        help_text="Current status of the task"
    )
    due_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Due date for the task (used in calendar view)"
    )
    assigned_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date and time when the task was assigned to a user"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, help_text="Task creation timestamp")
    updated_at = models.DateTimeField(auto_now=True, help_text="Task last update timestamp")

    class Meta:
        ordering = ['-created_at']  # Order by newest first
        verbose_name = "Task"
        verbose_name_plural = "Tasks"

    def is_overdue(self):
        """
        Check if task is overdue.
        Task is overdue if:
        - It has a due_date
        - It's not completed OR it was completed after the due date
        """
        if not self.due_date:
            return False
        
        from django.utils import timezone
        today = timezone.now().date()
        
        # If task is not completed and due date has passed
        if self.status != "completed" and self.due_date < today:
            return True
        
        # If task was completed after the due date
        if self.status == "completed" and self.updated_at:
            completed_date = self.updated_at.date()
            if completed_date > self.due_date:
                return True
        
        return False

    def __str__(self):
        """String representation of the task"""
        return f"{self.title} - {self.get_status_display()}"
