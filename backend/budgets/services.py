from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from .repositories import BudgetRepository
from .serializers import BudgetCreateSerializer, CategoryBudgetCreateSerializer


class BudgetService:
    @staticmethod
    def _validate_category(user, category_id):
        if not category_id:
            return None
        from categories.models import Category
        from django.db.models import Q
        category = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            id=category_id,
            is_active=True,
            category_type='EXPENSE'  # Budgets are only for expenses
        ).first()
        if not category:
            raise ValidationError({'category': 'Invalid or inaccessible expense category.'})
        return category

    @staticmethod
    def list_budgets(user, year=None):
        return BudgetRepository.get_all_for_user(user, year)

    @staticmethod
    def get_budget(budget_id, user):
        budget = BudgetRepository.get_by_id(budget_id, user)
        if not budget:
            raise NotFound({'detail': 'Budget not found.'})
        return budget

    @staticmethod
    def create_budget(user, data: dict):
        serializer = BudgetCreateSerializer(data=data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        
        # Check if budget already exists for this month/year
        existing = BudgetRepository.get_by_month_year(user, validated['month'], validated['year'])
        if existing:
            raise ValidationError({'detail': f"A budget already exists for {validated['month']}/{validated['year']}"})

        validated['user'] = user
        return BudgetRepository.create_budget(validated)

    @staticmethod
    def update_budget(budget_id, user, data: dict):
        budget = BudgetRepository.get_by_id(budget_id, user)
        if not budget:
            raise NotFound({'detail': 'Budget not found.'})

        serializer = BudgetCreateSerializer(data=data, partial=True)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)
        
        # Do not allow month/year change to clash with existing
        new_month = serializer.validated_data.get('month', budget.month)
        new_year = serializer.validated_data.get('year', budget.year)
        if (new_month != budget.month or new_year != budget.year):
            existing = BudgetRepository.get_by_month_year(user, new_month, new_year)
            if existing and existing.id != budget.id:
                raise ValidationError({'detail': f"A budget already exists for {new_month}/{new_year}"})

        return BudgetRepository.update_budget(budget, serializer.validated_data)

    @staticmethod
    def delete_budget(budget_id, user):
        budget = BudgetRepository.get_by_id(budget_id, user)
        if not budget:
            raise NotFound({'detail': 'Budget not found.'})
        BudgetRepository.soft_delete_budget(budget)
        return {'detail': 'Budget deleted successfully.'}

    # Category Budget Methods
    @staticmethod
    def create_category_budget(budget_id, user, data: dict):
        budget = BudgetRepository.get_by_id(budget_id, user)
        if not budget:
            raise NotFound({'detail': 'Budget not found.'})

        serializer = CategoryBudgetCreateSerializer(data=data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        category = BudgetService._validate_category(user, validated['category'])
        
        existing = BudgetRepository.get_category_budget_by_category(budget, category)
        if existing:
            raise ValidationError({'category': 'A budget limit for this category already exists in this month.'})

        validated['budget'] = budget
        validated['category'] = category
        return BudgetRepository.create_category_budget(validated)

    @staticmethod
    def update_category_budget(budget_id, cb_id, user, data: dict):
        budget = BudgetRepository.get_by_id(budget_id, user)
        if not budget:
            raise NotFound({'detail': 'Budget not found.'})

        cb = BudgetRepository.get_category_budget_by_id(cb_id, budget)
        if not cb:
            raise NotFound({'detail': 'Category Budget not found.'})

        serializer = CategoryBudgetCreateSerializer(data=data, partial=True)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)
        
        validated = serializer.validated_data
        if 'category' in validated:
            new_cat = BudgetService._validate_category(user, validated['category'])
            if new_cat != cb.category:
                existing = BudgetRepository.get_category_budget_by_category(budget, new_cat)
                if existing:
                    raise ValidationError({'category': 'A budget limit for this category already exists in this month.'})
            validated['category'] = new_cat

        return BudgetRepository.update_category_budget(cb, validated)

    @staticmethod
    def delete_category_budget(budget_id, cb_id, user):
        budget = BudgetRepository.get_by_id(budget_id, user)
        if not budget:
            raise NotFound({'detail': 'Budget not found.'})

        cb = BudgetRepository.get_category_budget_by_id(cb_id, budget)
        if not cb:
            raise NotFound({'detail': 'Category Budget not found.'})

        BudgetRepository.soft_delete_category_budget(cb)
        return {'detail': 'Category Budget deleted successfully.'}
