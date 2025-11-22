from django.urls import path
from .views import (
    TaskListCreateView,
    TaskRetrieveUpdateDeleteView,
)

urlpatterns = [
    # List all tasks (GET) or create new task (POST)
    path("", TaskListCreateView.as_view(), name="task_list_create"),
    
    # Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific task
    path("<int:pk>/", TaskRetrieveUpdateDeleteView.as_view(), name="task_detail"),
]
