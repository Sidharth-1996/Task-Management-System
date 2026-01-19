"""
Seed Command
Creates sample users for testing the application
Run with: python manage.py seed
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from accounts.models import User


class Command(BaseCommand):
    help = "Seed the database with default users (Admin, Manager, User)"

    def handle(self, *args, **options):
        """
        Create sample users with different roles for testing
        """
        users = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "password": "admin123",
                "role": "admin",
                "first_name": "Admin",
                "last_name": "User"
            },
            {
                "username": "manager",
                "email": "manager@example.com",
                "password": "manager123",
                "role": "manager",
                "first_name": "Manager",
                "last_name": "User"
            },
            {
                "username": "user",
                "email": "user@example.com",
                "password": "user123",
                "role": "user",
                "first_name": "Regular",
                "last_name": "User"
            },
        ]

        for u in users:
            # Check if user already exists
            user = None
            if User.objects.filter(username=u["username"]).exists():
                user = User.objects.get(username=u["username"])
            elif User.objects.filter(email=u["email"]).exists():
                user = User.objects.get(email=u["email"])
            
            if user:
                # Update existing user with correct password and role
                user.set_password(u["password"])
                user.email = u["email"]
                user.role = u["role"]
                user.first_name = u["first_name"]
                user.last_name = u["last_name"]
                user.is_active = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Updated user: {u['username']} ({u['role']})"))
            else:
                # Create user with hashed password
                user = User.objects.create_user(
                    username=u["username"],
                    email=u["email"],
                    password=u["password"],
                    first_name=u["first_name"],
                    last_name=u["last_name"],
                )
                # Set custom role field
                user.role = u["role"]
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user: {u['username']} ({u['role']})"))

        self.stdout.write(self.style.SUCCESS("\nSeeding complete!"))
        self.stdout.write(self.style.SUCCESS("\nSample credentials:"))
        self.stdout.write("  Admin:   admin@example.com / admin123")
        self.stdout.write("  Manager: manager@example.com / manager123")
        self.stdout.write("  User:    user@example.com / user123")
