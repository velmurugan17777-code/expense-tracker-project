from .models import Budget, CategoryBudget
from django.db.models import Prefetch

class BudgetRepository:
    """
    Repository layer for Budget and CategoryBudget.
    """

    @staticmethod
    def get_all_for_user(user, year=None):
        qs = Budget.objects.filter(user=user, is_active=True).prefetch_related(
            Prefetch('category_budgets', queryset=CategoryBudget.objects.filter(is_active=True).select_related('category'))
        )
        if year:
            qs = qs.filter(year=year)
        return qs

    @staticmethod
    def get_by_id(budget_id, user):
        try:
            return Budget.objects.prefetch_related(
                Prefetch('category_budgets', queryset=CategoryBudget.objects.filter(is_active=True).select_related('category'))
            ).get(id=budget_id, user=user, is_active=True)
        except Budget.DoesNotExist:
            return None

    @staticmethod
    def get_by_month_year(user, month, year):
        try:
            return Budget.objects.prefetch_related(
                Prefetch('category_budgets', queryset=CategoryBudget.objects.filter(is_active=True).select_related('category'))
            ).get(user=user, month=month, year=year, is_active=True)
        except Budget.DoesNotExist:
            return None

    @staticmethod
    def create_budget(data: dict) -> Budget:
        return Budget.objects.create(**data)

    @staticmethod
    def update_budget(budget: Budget, data: dict) -> Budget:
        for field, value in data.items():
            setattr(budget, field, value)
        budget.save()
        return budget

    @staticmethod
    def soft_delete_budget(budget: Budget):
        budget.is_active = False
        budget.save(update_fields=['is_active'])
        # Soft delete child category budgets
        budget.category_budgets.filter(is_active=True).update(is_active=False)

    @staticmethod
    def get_category_budget_by_id(cb_id, budget):
        try:
            return CategoryBudget.objects.get(id=cb_id, budget=budget, is_active=True)
        except CategoryBudget.DoesNotExist:
            return None

    @staticmethod
    def get_category_budget_by_category(budget, category):
        try:
            return CategoryBudget.objects.get(budget=budget, category=category, is_active=True)
        except CategoryBudget.DoesNotExist:
            return None

    @staticmethod
    def create_category_budget(data: dict) -> CategoryBudget:
        return CategoryBudget.objects.create(**data)

    @staticmethod
    def update_category_budget(cb: CategoryBudget, data: dict) -> CategoryBudget:
        for field, value in data.items():
            setattr(cb, field, value)
        cb.save()
        return cb

    @staticmethod
    def soft_delete_category_budget(cb: CategoryBudget):
        cb.is_active = False
        cb.save(update_fields=['is_active'])
