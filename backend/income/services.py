from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from .repositories import IncomeRepository
from .serializers import IncomeCreateSerializer


class IncomeService:
    """
    Service layer — all Income business logic lives here.
    Views are thin and only call this service.
    """

    @staticmethod
    def _validate_category(user, category_id):
        """
        Ensures the category exists and belongs to the user (or is system-wide).
        Raises ValidationError if the category is not accessible.
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
    def list_income(user, filters: dict = None, page: int = 1, page_size: int = 10):
        """
        Returns paginated income records for the user.
        """
        queryset = IncomeRepository.get_all_for_user(user, filters)
        total_count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = queryset[start:end]
        return {
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': max(1, -(-total_count // page_size)),  # ceiling division
            'results': items,
        }

    @staticmethod
    def get_income(income_id, user):
        income = IncomeRepository.get_by_id(income_id, user)
        if not income:
            raise NotFound({'detail': 'Income record not found.'})
        return income

    @staticmethod
    def create_income(user, data: dict):
        serializer = IncomeCreateSerializer(data=data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        # Validate category accessibility
        category = IncomeService._validate_category(user, validated.get('category'))
        validated['user'] = user  # Inject user — never trust client
        validated['category'] = category
        return IncomeRepository.create(validated)

    @staticmethod
    def update_income(income_id, user, data: dict):
        income = IncomeRepository.get_by_id(income_id, user)
        if not income:
            raise NotFound({'detail': 'Income record not found.'})

        serializer = IncomeCreateSerializer(data=data, partial=True)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        if 'category' in validated:
            validated['category'] = IncomeService._validate_category(
                user, validated.get('category')
            )
        return IncomeRepository.update(income, validated)

    @staticmethod
    def delete_income(income_id, user):
        income = IncomeRepository.get_by_id(income_id, user)
        if not income:
            raise NotFound({'detail': 'Income record not found.'})
        IncomeRepository.soft_delete(income)
        return {'detail': 'Income record deleted successfully.'}

    @staticmethod
    def get_summary(user):
        """Returns total income + monthly breakdown (used by Dashboard)."""
        from datetime import date
        current_year = date.today().year
        monthly = list(IncomeRepository.get_monthly_totals(user, current_year))
        return {
            'total': IncomeRepository.get_total_for_user(user),
            'monthly_breakdown': [
                {
                    'month': entry['month'].strftime('%B %Y'),
                    'total': float(entry['total'])
                }
                for entry in monthly
            ]
        }
