from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    UserUpdateSerializer,
    CustomTokenObtainPairSerializer
)
from tasks.permissions import IsAdmin, IsManagerOrAdmin


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that includes user data in response
    Supports login with either username or email
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                # Get username or email from request
                username = request.data.get('username') or request.data.get('email')
                
                # Try to get user by username first, then by email
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    user = User.objects.get(email=username)
                
                # Serialize user data
                user_serializer = UserSerializer(user)
                # Add user data to response
                response.data['user'] = user_serializer.data
            except (User.DoesNotExist, Exception) as e:
                # If user not found, continue without user data
                # This shouldn't happen if authentication succeeded, but handle gracefully
                pass
        return response


class RegisterView(generics.CreateAPIView):
    """
    View for user registration (signup).
    Public endpoint - no authentication required.
    Returns JWT tokens upon successful registration.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Create a new user account and return JWT tokens.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        # Return user data and tokens
        user_serializer = UserSerializer(user)
        return Response({
            'user': user_serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class UserListView(generics.ListCreateAPIView):
    """
    View for listing and creating users.
    - GET: List users (Admin sees all, Manager sees team members)
    - POST: Create new user (Admin only)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get_queryset(self):
        """
        Return users based on role:
        - Admin: All users
        - Manager: Only their team members (users with manager=current_user)
        """
        user = self.request.user
        
        if user.role == "admin":
            # Admin can see all users
            return User.objects.all().order_by('username')
        elif user.role == "manager":
            # Manager can only see their team members
            return User.objects.filter(manager=user).order_by('username')
        else:
            # Regular users shouldn't access this endpoint (permission will block)
            return User.objects.none()
    
    def get_serializer_class(self):
        """
        Use different serializers for GET and POST.
        - GET: UserSerializer (read-only, no password)
        - POST: UserUpdateSerializer (for creating users with password)
        """
        if self.request.method == 'POST':
            from .serializers import UserUpdateSerializer
            return UserUpdateSerializer
        return UserSerializer
    
    def perform_create(self, serializer):
        """
        Create a new user.
        Only Admin can create users.
        """
        user = self.request.user
        if user.role != "admin":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only Admin can create users.")
        serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting a specific user.
    Admin only endpoint.
    """
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        """
        Use UserSerializer for GET, UserUpdateSerializer for PUT/PATCH.
        """
        if self.request.method == 'GET':
            return UserSerializer
        return UserUpdateSerializer
