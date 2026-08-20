from celery import shared_task
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from django.utils import timezone
import datetime
import calendar
from decimal import Decimal

from expenses.repositories import ExpenseRepository
from income.repositories import IncomeRepository
from ai_engine.services import AIEngineService
from notifications.tasks import send_email_task

User = get_user_model()

@shared_task
def send_daily_expense_summary():
    """Sends a daily summary of expenses to all active users."""
    today = timezone.now().date()
    users = User.objects.filter(is_active=True)
    
    for user in users:
        filters = {
            'date_from': today.strftime("%Y-%m-%d"),
            'date_to': today.strftime("%Y-%m-%d")
        }
        expenses = ExpenseRepository.get_all_for_user(user, filters)
        total_spent = sum(Decimal(str(e.amount)) for e in expenses)
        
        context = {
            'user': user,
            'date': today.strftime("%B %d, %Y"),
            'total_spent': f"{total_spent:.2f}",
            'expenses': expenses
        }
        
        html_content = render_to_string('emails/daily_summary.html', context)
        text_content = f"Daily Expense Summary for {today}: Total Spent: ${total_spent:.2f}"
        
        send_email_task.delay(
            subject=f"Your Daily Expense Summary - {today.strftime('%B %d')}",
            text_content=text_content,
            html_content=html_content,
            to_emails=[user.email]
        )


@shared_task
def send_weekly_financial_report():
    """Sends a weekly summary of income and expenses, plus AI advice."""
    today = timezone.now().date()
    start_date = today - datetime.timedelta(days=7)
    users = User.objects.filter(is_active=True)
    
    for user in users:
        filters = {
            'date_from': start_date.strftime("%Y-%m-%d"),
            'date_to': today.strftime("%Y-%m-%d")
        }
        
        expenses = ExpenseRepository.get_all_for_user(user, filters)
        total_spent = sum(Decimal(str(e.amount)) for e in expenses)
        
        incomes = IncomeRepository.get_all_for_user(user, filters)
        total_income = sum(Decimal(str(i.amount)) for i in incomes)
        
        # Get AI Advice
        ai_advice = AIEngineService.generate_advice(user)
        
        context = {
            'user': user,
            'start_date': start_date.strftime("%B %d"),
            'end_date': today.strftime("%B %d, %Y"),
            'total_spent': f"{total_spent:.2f}",
            'total_income': f"{total_income:.2f}",
            'ai_advice': ai_advice
        }
        
        html_content = render_to_string('emails/weekly_report.html', context)
        text_content = f"Weekly Report ({start_date} to {today}): Income: ${total_income:.2f}, Spent: ${total_spent:.2f}"
        
        send_email_task.delay(
            subject=f"Your Weekly Financial Report - {today.strftime('%b %d')}",
            text_content=text_content,
            html_content=html_content,
            to_emails=[user.email]
        )


@shared_task
def send_monthly_financial_report():
    """Sends a monthly summary of the PREVIOUS month."""
    today = timezone.now().date()
    # Calculate previous month
    if today.month == 1:
        prev_month = 12
        prev_year = today.year - 1
    else:
        prev_month = today.month - 1
        prev_year = today.year
        
    last_day = calendar.monthrange(prev_year, prev_month)[1]
    
    date_from = f"{prev_year}-{prev_month:02d}-01"
    date_to = f"{prev_year}-{prev_month:02d}-{last_day:02d}"
    
    month_name = calendar.month_name[prev_month]
    
    users = User.objects.filter(is_active=True)
    for user in users:
        filters = {'date_from': date_from, 'date_to': date_to}
        
        expenses = ExpenseRepository.get_all_for_user(user, filters)
        total_spent = sum(Decimal(str(e.amount)) for e in expenses)
        
        incomes = IncomeRepository.get_all_for_user(user, filters)
        total_income = sum(Decimal(str(i.amount)) for i in incomes)
        
        savings = total_income - total_spent
        savings_rate = (savings / total_income * 100) if total_income > 0 else 0
        
        # Get AI Advice (using current state)
        ai_advice = AIEngineService.generate_advice(user)
        
        context = {
            'user': user,
            'month_name': month_name,
            'year': prev_year,
            'total_spent': f"{total_spent:.2f}",
            'total_income': f"{total_income:.2f}",
            'savings': f"{savings:.2f}",
            'savings_rate': f"{savings_rate:.1f}",
            'ai_advice': ai_advice
        }
        
        html_content = render_to_string('emails/monthly_report.html', context)
        text_content = f"Monthly Report for {month_name} {prev_year}: Income: ${total_income:.2f}, Spent: ${total_spent:.2f}, Savings: ${savings:.2f}"
        
        send_email_task.delay(
            subject=f"Your Monthly Financial Report - {month_name} {prev_year}",
            text_content=text_content,
            html_content=html_content,
            to_emails=[user.email]
        )
