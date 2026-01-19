"""
Create Demo Users Command
Creates demo users for production deployment
Run with: python manage.py create_demo_users
"""
from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Create demo users (Admin, Manager, User) for production"

    def handle(self, *args, **kwargs):
        users = [
            {
                "email": "admin@example.com",
                "username": "admin",
                "password": "admin123",
                "is_superuser": True,
                "is_staff": True,
                "role": "admin",
                "first_name": "Admin",
                "last_name": "User",
            },
            {
                "email": "manager@example.com",
                "username": "manager",
                "password": "manager123",
                "is_superuser": False,
                "is_staff": True,
                "role": "manager",
                "first_name": "Manager",
                "last_name": "User",
            },
            {
                "email": "user@example.com",
                "username": "user",
                "password": "user123",
                "is_superuser": False,
                "is_staff": False,
                "role": "user",
                "first_name": "Regular",
                "last_name": "User",
            },
        ]

        for data in users:
            # Check if user already exists by email or username
            if User.objects.filter(email=data["email"]).exists():
                user = User.objects.get(email=data["email"])
                # Update existing user
                user.set_password(data["password"])
                user.username = data["username"]
                user.role = data["role"]
                user.is_superuser = data["is_superuser"]
                user.is_staff = data["is_staff"]
                user.first_name = data.get("first_name", "")
                user.last_name = data.get("last_name", "")
                user.is_active = True
                user.save()
                self.stdout.write(self.style.WARNING(f"{data['email']} already exists - updated"))
            elif User.objects.filter(username=data["username"]).exists():
                user = User.objects.get(username=data["username"])
                # Update existing user
                user.set_password(data["password"])
                user.email = data["email"]
                user.role = data["role"]
                user.is_superuser = data["is_superuser"]
                user.is_staff = data["is_staff"]
                user.first_name = data.get("first_name", "")
                user.last_name = data.get("last_name", "")
                user.is_active = True
                user.save()
                self.stdout.write(self.style.WARNING(f"{data['email']} already exists (by username) - updated"))
            else:
                # Create new user
                user = User.objects.create_user(
                    email=data["email"],
                    username=data["username"],
                    password=data["password"],
                    first_name=data.get("first_name", ""),
                    last_name=data.get("last_name", ""),
                )
                user.is_superuser = data["is_superuser"]
                user.is_staff = data["is_staff"]
                user.role = data["role"]
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created {data['email']}"))

        self.stdout.write(self.style.SUCCESS("\nDemo users ready!"))
        self.stdout.write(self.style.SUCCESS("\nCredentials:"))
        self.stdout.write("  Admin:   admin@example.com / admin123")
        self.stdout.write("  Manager: manager@example.com / manager123")
        self.stdout.write("  User:    user@example.com / user123")

