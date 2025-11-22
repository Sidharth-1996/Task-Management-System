from rest_framework import serializers
from .models import Task
from accounts.serializers import UserSerializer

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model.
    Handles task creation, update, and display with proper user relationships.
    """
    # Read-only fields for displaying user information (allow_null for assigned_to)
    assigned_to = UserSerializer(read_only=True, allow_null=True)
    created_by = UserSerializer(read_only=True)

    # Write-only field for assigning tasks (accepts user ID)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    # Computed field for status display
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Computed field for overdue status
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "status_display",
            "assigned_to", "assigned_to_id", "created_by", 
            "due_date", "assigned_at", "created_at", "updated_at", "is_overdue"
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "assigned_at"]

    def create(self, validated_data):
        """
        Create a new task.
        The created_by is passed from perform_create() via serializer.save(created_by=user),
        so it will be in validated_data.
        """
        # Extract assigned_to_id if provided
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        
        # Create task (created_by is already in validated_data from perform_create)
        task = Task.objects.create(**validated_data)
        
        # Assign task to user if assigned_to_id provided
        if assigned_to_id:
            from accounts.models import User
            from django.utils import timezone
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                task.assigned_to = assigned_user
                task.assigned_at = timezone.now()  # Set assignment timestamp
                task.save()
            except User.DoesNotExist:
                pass  # Invalid user ID, task created without assignment
        
        return task

    def update(self, instance, validated_data):
        """
        Update an existing task.
        Handles assigned_to_id separately to set the foreign key.
        """
        # Extract assigned_to_id if provided
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update assigned_to if assigned_to_id provided
        if assigned_to_id is not None:
            from accounts.models import User
            from django.utils import timezone
            if assigned_to_id:
                try:
                    assigned_user = User.objects.get(id=assigned_to_id)
                    # Only update assigned_at if this is a new assignment (was None or different user)
                    if instance.assigned_to != assigned_user:
                        instance.assigned_to = assigned_user
                        instance.assigned_at = timezone.now()  # Set assignment timestamp
                    else:
                        instance.assigned_to = assigned_user  # Same user, keep existing assigned_at
                except User.DoesNotExist:
                    pass  # Invalid user ID, keep current assignment
            else:
                instance.assigned_to = None  # Unassign task
                instance.assigned_at = None  # Clear assignment timestamp
        
        instance.save()
        return instance
