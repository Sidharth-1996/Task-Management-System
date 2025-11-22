"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomTokenObtainPairView
from tasks.views import TaskCalendarView


urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path("api/accounts/", include("accounts.urls")),
    
    # JWT token endpoints (using custom view to include user data)
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Task endpoints
    path("api/tasks/", include("tasks.urls")),

    # Calendar endpoint
    path("api/tasks/calendar/", TaskCalendarView, name="task_calendar"),
]
