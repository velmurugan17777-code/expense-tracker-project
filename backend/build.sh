#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Running migrations..."
python manage.py migrate

echo "Starting server..."
# For Docker deployments, we also need to start gunicorn here
gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 core.wsgi:application
