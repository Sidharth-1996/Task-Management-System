#!/bin/bash
# Script to create demo users during deployment
# Usage: ./create_demo_users.sh

python manage.py migrate --noinput
python manage.py create_demo_users

