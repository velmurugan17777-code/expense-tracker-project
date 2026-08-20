from django.db.models import Q, Sum
from .models import Expense


class ExpenseRepository:
    """
    Repository layer for Expense model.
    Isolates database queries from business logic.
    """

    @staticmethod
    def get_all_for_user(user, filters: dict = None):
        """
        Returns active expense records for a user.
        Supports filtering by date range, category, and search.
        """
        qs = Expense.objects.filter(user=user, is_active=True).select_related('category')

        if filters:
            if filters.get('date_from'):
                qs = qs.filter(date__gte=filters['date_from'])
            if filters.get('date_to'):
                qs = qs.filter(date__lte=filters['date_to'])
            if filters.get('category_id'):
                qs = qs.filter(category__id=filters['category_id'])
            if filters.get('search'):
                qs = qs.filter(
                    Q(title__icontains=filters['search']) |
                    Q(payee__icontains=filters['search'])
                )
            if filters.get('ordering') in ['amount', '-amount', 'date', '-date']:
                qs = qs.order_by(filters['ordering'])

        return qs

    @staticmethod
    def get_by_id(expense_id, user):
        try:
            return Expense.objects.get(id=expense_id, user=user, is_active=True)
        except Expense.DoesNotExist:
            return None

    @staticmethod
    def create(data: dict) -> Expense:
        return Expense.objects.create(**data)

    @staticmethod
    def update(expense: Expense, data: dict) -> Expense:
        for field, value in data.items():
            setattr(expense, field, value)
        expense.save()
        return expense

    @staticmethod
    def soft_delete(expense: Expense):
        expense.is_active = False
        expense.save(update_fields=['is_active'])

    @staticmethod
    def get_total_for_user(user) -> float:
        """Returns the sum of all active expenses for a user (Dashboard)."""
        result = Expense.objects.filter(
            user=user, is_active=True
        ).aggregate(total=Sum('amount'))
        return float(result['total'] or 0)

    @staticmethod
    def get_total_for_month(user, month: int, year: int) -> float:
        """Returns the total expenses for a user in a specific month and year."""
        result = Expense.objects.filter(
            user=user, is_active=True, date__month=month, date__year=year
        ).aggregate(total=Sum('amount'))
        return float(result['total'] or 0)

    @staticmethod
    def get_category_total_for_month(user, category_id, month: int, year: int) -> float:
        """Returns the total expenses for a user in a specific category and month."""
        result = Expense.objects.filter(
            user=user, category_id=category_id, is_active=True, date__month=month, date__year=year
        ).aggregate(total=Sum('amount'))
        return float(result['total'] or 0)

    @staticmethod
    def get_monthly_totals(user, year: int):
        """Returns monthly expense totals for a given year (Charts)."""
        from django.db.models.functions import TruncMonth
        return (
            Expense.objects
            .filter(user=user, is_active=True, date__year=year)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )
