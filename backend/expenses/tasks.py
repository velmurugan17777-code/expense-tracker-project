from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from .models import Expense
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_recurring_expenses():
    """
    Finds active recurring expenses that are due and duplicates them for the new date.
    """
    today = timezone.now().date()
    
    # We look for expenses that have a recurrence set, and whose next_recurrence_date is today or in the past
    expenses = Expense.objects.filter(
        recurrence__in=['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
        is_active=True,
        next_recurrence_date__lte=today
    )
    
    for expense in expenses:
        try:
            # Create the new duplicated expense
            new_expense = Expense.objects.create(
                user=expense.user,
                category=expense.category,
                title=expense.title,
                amount=expense.amount,
                date=expense.next_recurrence_date,
                description=expense.description,
                payee=expense.payee,
                recurrence='NONE', # The new record itself is not recurring
                parent=expense
            )
            
            # Calculate the next recurrence date for the parent
            if expense.recurrence == 'DAILY':
                expense.next_recurrence_date += timedelta(days=1)
            elif expense.recurrence == 'WEEKLY':
                expense.next_recurrence_date += timedelta(weeks=1)
            elif expense.recurrence == 'MONTHLY':
                expense.next_recurrence_date += relativedelta(months=1)
            elif expense.recurrence == 'YEARLY':
                expense.next_recurrence_date += relativedelta(years=1)
                
            expense.save()
            logger.info(f"Processed recurring expense {expense.id} -> created {new_expense.id}")
            
        except Exception as e:
            logger.error(f"Failed to process recurring expense {expense.id}: {e}")

