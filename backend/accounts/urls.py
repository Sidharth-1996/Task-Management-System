from django.urls import path
from .views import RegisterView, UserListView, UserDetailView

urlpatterns = [
    # Public endpoints
    path("signup/", RegisterView.as_view(), name="signup"),
    
    # Admin-only endpoints for user management
    path("users/", UserListView.as_view(), name="user_list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user_detail"),
]
