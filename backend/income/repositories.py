from django.db.models import Q, Sum
from .models import Income


class IncomeRepository:
    """
    Repository layer — all Income DB operations.
    No business logic, only data access.
    """

    @staticmethod
    def get_all_for_user(user, filters: dict = None):
        """
        Returns active income records for a user.
        Supports optional filtering: date_from, date_to, category_id, search.
        """
        qs = Income.objects.filter(user=user, is_active=True).select_related('category')

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
                    Q(source__icontains=filters['search'])
                )
            if filters.get('ordering') in ['amount', '-amount', 'date', '-date']:
                qs = qs.order_by(filters['ordering'])

        return qs

    @staticmethod
    def get_by_id(income_id, user):
        try:
            return Income.objects.get(id=income_id, user=user, is_active=True)
        except Income.DoesNotExist:
            return None

    @staticmethod
    def create(data: dict) -> Income:
        return Income.objects.create(**data)

    @staticmethod
    def update(income: Income, data: dict) -> Income:
        for field, value in data.items():
            setattr(income, field, value)
        income.save()
        return income

    @staticmethod
    def soft_delete(income: Income):
        income.is_active = False
        income.save(update_fields=['is_active'])

    @staticmethod
    def get_total_for_user(user) -> float:
        """Returns sum of all active income for a user (used in Dashboard)."""
        result = Income.objects.filter(
            user=user, is_active=True
        ).aggregate(total=Sum('amount'))
        return float(result['total'] or 0)

    @staticmethod
    def get_monthly_totals(user, year: int):
        """Returns monthly income totals for a given year (used in Charts)."""
        from django.db.models.functions import TruncMonth
        return (
            Income.objects
            .filter(user=user, is_active=True, date__year=year)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )
