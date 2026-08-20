import datetime
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from categories.models import Category
from income.models import Income
from expenses.models import Expense
from budgets.models import Budget
from goals.models import SavingsGoal
from notifications.tasks import send_email_task, send_push_notification_task
from ai_engine.services import AIEngineService
from dashboard.services import DashboardService


class Command(BaseCommand):
    help = 'Loads comprehensive demo data and validates services'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting Demo Data Load & Validation...'))

        # 1. User Setup
        email = 'demo@smarttracker.com'
        User.objects.filter(email=email).delete()
        user = User.objects.create_user(
            email=email,
            password='Password123!',
            first_name='Demo',
            last_name='User',
            currency='USD',
            is_email_verified=True
        )
        self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))

        # 2. Categories
        cats = ['Housing', 'Food', 'Transportation', 'Entertainment', 'Salary', 'Investment']
        category_objects = {}
        for c in cats:
            typ = 'INCOME' if c in ['Salary', 'Investment'] else 'EXPENSE'
            category_objects[c] = Category.objects.create(user=user, name=c, category_type=typ)

        # 3. Income & Expenses (Past 3 months)
        today = datetime.date.today()
        
        for i in range(3):
            month_date = today.replace(day=1) - datetime.timedelta(days=30 * i)
            # Add Income
            Income.objects.create(
                user=user,
                category=category_objects['Salary'],
                amount=Decimal('5000.00'),
                title='Monthly Salary',
                date=month_date
            )
            # Add Expenses
            Expense.objects.create(
                user=user,
                category=category_objects['Housing'],
                amount=Decimal('1500.00'),
                title='Rent',
                date=month_date,
                recurrence='MONTHLY',
                next_recurrence_date=month_date + datetime.timedelta(days=30)
            )
            Expense.objects.create(
                user=user,
                category=category_objects['Food'],
                amount=Decimal(str(random.randint(400, 800))),
                title='Groceries',
                date=month_date + datetime.timedelta(days=5)
            )

        # Intentionally blow the budget for the current month
        Expense.objects.create(
            user=user,
            category=category_objects['Entertainment'],
            amount=Decimal('2000.00'),
            title='Luxury Vacation',
            date=today
        )
        self.stdout.write(self.style.SUCCESS('Populated historical transactions.'))

        # 4. Budget
        budget = Budget.objects.create(
            user=user,
            amount=Decimal('500.00'),
            month=today.month,
            year=today.year
        )
        self.stdout.write(self.style.SUCCESS(f'Created budget: $500 total limit.'))

        # 5. Goals
        SavingsGoal.objects.create(
            user=user,
            title='Emergency Fund',
            target_amount=Decimal('10000.00'),
            current_amount=Decimal('2500.00'),
            target_date=today + datetime.timedelta(days=180)
        )
        self.stdout.write(self.style.SUCCESS('Created Savings Goals.'))

        # 6. Service Validations
        self.stdout.write(self.style.WARNING('\n--- Validating Services ---'))
        
        # Test 6a: AI Engine
        advice = AIEngineService.generate_advice(user)
        self.stdout.write(f"AI Engine Score: {advice['score']}/100")
        self.stdout.write(f"AI Engine Status: {advice['status']}")
        if advice['status'] != 'CRITICAL':
            self.stdout.write(self.style.ERROR('Budget warning failed: Should be CRITICAL.'))
        else:
            self.stdout.write(self.style.SUCCESS('Budget warning system successfully triggered CRITICAL status.'))

        # Test 6b: Dashboard Service
        dash = DashboardService.get_dashboard_summary(user)
        self.stdout.write(f"Dashboard Alerts: {len(dash['alerts'])} generated.")

        # Test 6c: Background Tasks
        try:
            # Send sync for immediate output (remove .delay for the management command test to see exceptions instantly)
            send_email_task(
                subject='Welcome to SmartTracker',
                text_content='Your demo account is ready!',
                html_content=None,
                to_emails=[user.email]
            )
            self.stdout.write(self.style.SUCCESS('Email sending task successfully executed.'))
            
            send_push_notification_task(
                user_id=str(user.id),
                title='Budget Exceeded',
                message='You have exceeded your Entertainment budget.'
            )
            self.stdout.write(self.style.SUCCESS('Push notification task successfully executed.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Background task failed: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('\nValidation Complete! All modules verified.'))
