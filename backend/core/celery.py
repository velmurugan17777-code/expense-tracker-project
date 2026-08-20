import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

from celery.schedules import crontab

@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Runs daily at 20:00 (8 PM)
    sender.add_periodic_task(
        crontab(hour=20, minute=0),
        'reports.tasks.send_daily_expense_summary',
    )
    
    # Runs weekly on Sunday at 08:00 AM
    sender.add_periodic_task(
        crontab(day_of_week='sun', hour=8, minute=0),
        'reports.tasks.send_weekly_financial_report',
    )
    
    # Runs monthly on the 1st day of the month at 08:00 AM
    sender.add_periodic_task(
        crontab(day_of_month='1', hour=8, minute=0),
        'reports.tasks.send_monthly_financial_report',
    )

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
