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
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                username = request.data.get('username') or request.data.get('email')
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    user = User.objects.get(email=username)
                user_serializer = UserSerializer(user)
                response.data['user'] = user_serializer.data
            except (User.DoesNotExist, Exception) as e:
                pass
        return response


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)
        return Response({
            'user': user_serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return User.objects.all().order_by('username')
        elif user.role == "manager":
            return User.objects.filter(manager=user).order_by('username')
        else:
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