from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from django.contrib.auth.hashers import make_password


# Custom JWT Token Serializer that supports email/username login
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that allows login with either username or email
    """
    username_field = 'username'

    def validate(self, attrs):
        """
        Override validate to support email/username login
        """
        # Get username or email from request
        username = attrs.get('username')
        password = attrs.get('password')

        # Validate that username and password are provided
        if not username:
            raise serializers.ValidationError({
                'username': 'This field is required.'
            })
        
        if not password:
            raise serializers.ValidationError({
                'password': 'This field is required.'
            })

        # Try to find user by username first, then by email
        user = None
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username)
                # Update attrs to use the actual username for authentication
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'username': 'No active account found with the given credentials'
                })

        # Authenticate with the username and password
        from django.contrib.auth import authenticate
        authenticated_user = authenticate(username=user.username, password=password)
        
        if not authenticated_user:
            raise serializers.ValidationError({
                'password': 'Invalid password'
            })

        if not authenticated_user.is_active:
            raise serializers.ValidationError({
                'username': 'User account is disabled'
            })

        # Get token data
        refresh = self.get_token(authenticated_user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        return data


# Serializer for user registration
class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Handles password hashing using Django's make_password (which uses PBKDF2).
    """
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name", "role"]
        extra_kwargs = {
            "password": {"write_only": True},
            "username": {"required": True},
        }

    def create(self, validated_data):
        """
        Create a new user with hashed password.
        Password is hashed using Django's make_password (PBKDF2 algorithm).
        """
        # Hash the password before saving
        validated_data["password"] = make_password(validated_data["password"])
        # Set username to email if username not provided
        if "username" not in validated_data or not validated_data["username"]:
            validated_data["username"] = validated_data["email"]
        return User.objects.create(**validated_data)

# Serializer for user data (without password)
class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user data display.
    Excludes password field for security.
    """
    name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "name", "manager", "manager_name"]
        read_only_fields = ["id"]
        depth = 1  # Include nested manager object details
    
    def get_name(self, obj):
        """Get full name or username if name not available"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        return obj.username
    
    def get_manager_name(self, obj):
        """Get manager's name if assigned"""
        if obj.manager:
            if obj.manager.first_name and obj.manager.last_name:
                return f"{obj.manager.first_name} {obj.manager.last_name}"
            return obj.manager.username
        return None

# Serializer for user update (Admin only)
class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user information (Admin only).
    Allows password update with hashing and manager assignment.
    """
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    manager_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name", "role", "manager", "manager_id"]
        extra_kwargs = {
            "password": {"write_only": True, "required": False},
            "manager": {"read_only": True},  # Use manager_id for writing
        }
    
    def validate_manager_id(self, value):
        """Validate that manager_id refers to a user with manager role"""
        if value is not None:
            try:
                manager = User.objects.get(id=value, role='manager')
                return value
            except User.DoesNotExist:
                raise serializers.ValidationError("Manager ID must refer to a user with manager role.")
        return value

    def update(self, instance, validated_data):
        """
        Update user information.
        Only hash password if it's being updated.
        Handle manager assignment via manager_id.
        """
        # Extract manager_id if provided
        manager_id = validated_data.pop('manager_id', None)
        
        # Hash password only if it's being updated
        if "password" in validated_data:
            validated_data["password"] = make_password(validated_data["password"])
        
        # Update manager if manager_id provided
        if manager_id is not None:
            if manager_id:
                try:
                    manager = User.objects.get(id=manager_id, role='manager')
                    instance.manager = manager
                except User.DoesNotExist:
                    pass  # Invalid manager ID, keep current manager
            else:
                instance.manager = None  # Remove manager assignment
        
        # Update other fields
        return super().update(instance, validated_data)
