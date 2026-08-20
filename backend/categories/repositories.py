from django.db.models import Q
from .models import Category


class CategoryRepository:
    """
    Repository layer for Category model.
    Encapsulates all DB access patterns — no business logic here.
    """

    @staticmethod
    def get_all_for_user(user):
        """
        Returns all categories visible to the user:
        - Their own personal categories (user=user)
        - System-wide categories (user=None)
        """
        return Category.objects.filter(
            is_active=True
        ).filter(
            Q(user=user) | Q(user__isnull=True)
        ).order_by('category_type', 'name')

    @staticmethod
    def get_by_id(category_id, user):
        """
        Retrieves a category owned by the user or a system category.
        """
        try:
            from django.db.models import Q
            return Category.objects.get(
                id=category_id,
                is_active=True
            )
        except Category.DoesNotExist:
            return None

    @staticmethod
    def create(data: dict) -> Category:
        return Category.objects.create(**data)

    @staticmethod
    def update(category: Category, data: dict) -> Category:
        for field, value in data.items():
            setattr(category, field, value)
        category.save()
        return category

    @staticmethod
    def soft_delete(category: Category) -> Category:
        """Mark as inactive instead of hard deleting."""
        category.is_active = False
        category.save(update_fields=['is_active'])
        return category

    @staticmethod
    def filter_by_type(user, category_type: str):
        from django.db.models import Q
        return Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            category_type=category_type,
            is_active=True,
        ).order_by('name')
