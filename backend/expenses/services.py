from rest_framework.exceptions import ValidationError, NotFound
from .repositories import ExpenseRepository
from .serializers import ExpenseCreateSerializer


class ExpenseService:
    """
    Service layer containing all business logic for Expenses.
    """

    @staticmethod
    def _validate_category(user, category_id):
        """
        Validates the category belongs to the user or is a system category.
        """
        if not category_id:
            return None
        from categories.models import Category
        from django.db.models import Q
        
        category_pk = category_id.id if hasattr(category_id, 'id') else category_id
        category = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            id=category_pk,
            is_active=True,
        ).first()
        if not category:
            raise ValidationError({'category': 'Invalid or inaccessible category.'})
        return category

    @staticmethod
    def list_expenses(user, filters: dict = None, page: int = 1, page_size: int = 10):
        queryset = ExpenseRepository.get_all_for_user(user, filters)
        total_count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = queryset[start:end]
        return {
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': max(1, -(-total_count // page_size)),
            'results': items,
        }

    @staticmethod
    def get_expense(expense_id, user):
        expense = ExpenseRepository.get_by_id(expense_id, user)
        if not expense:
            raise NotFound({'detail': 'Expense record not found.'})
        return expense

    @staticmethod
    def create_expense(user, data: dict):
        serializer = ExpenseCreateSerializer(data=data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        category = ExpenseService._validate_category(user, validated.get('category'))
        validated['user'] = user
        validated['category'] = category
        return ExpenseRepository.create(validated)

    @staticmethod
    def update_expense(expense_id, user, data: dict):
        expense = ExpenseRepository.get_by_id(expense_id, user)
        if not expense:
            raise NotFound({'detail': 'Expense record not found.'})

        serializer = ExpenseCreateSerializer(data=data, partial=True)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        if 'category' in validated:
            validated['category'] = ExpenseService._validate_category(
                user, validated.get('category')
            )
        return ExpenseRepository.update(expense, validated)

    @staticmethod
    def delete_expense(expense_id, user):
        expense = ExpenseRepository.get_by_id(expense_id, user)
        if not expense:
            raise NotFound({'detail': 'Expense record not found.'})
        ExpenseRepository.soft_delete(expense)
        return {'detail': 'Expense record deleted successfully.'}

    @staticmethod
    def get_summary(user):
        """Returns total expense + monthly breakdown."""
        from datetime import date
        current_year = date.today().year
        monthly = list(ExpenseRepository.get_monthly_totals(user, current_year))
        return {
            'total': ExpenseRepository.get_total_for_user(user),
            'monthly_breakdown': [
                {
                    'month': entry['month'].strftime('%B %Y'),
                    'total': float(entry['total'])
                }
                for entry in monthly
            ]
        }
