from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound
from .repositories import CategoryRepository
from .serializers import CategoryCreateSerializer


class CategoryService:
    """
    Service layer for Category business logic.
    Rules:
    - Users can CRUD their own categories.
    - System categories (user=None) are read-only for regular users.
    - No duplicate name+type per user.
    """

    @staticmethod
    def list_categories(user, category_type=None):
        if category_type:
            return CategoryRepository.filter_by_type(user, category_type)
        return CategoryRepository.get_all_for_user(user)

    @staticmethod
    def get_category(category_id, user):
        category = CategoryRepository.get_by_id(category_id, user)
        if not category:
            raise NotFound({'detail': 'Category not found.'})
        return category

    @staticmethod
    def create_category(user, data: dict):
        serializer = CategoryCreateSerializer(data=data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        validated['user'] = user  # Inject user from service layer — never from client

        # Enforce uniqueness: same user, same name, same type
        from .models import Category
        exists = Category.objects.filter(
            user=user,
            name__iexact=validated['name'],
            category_type=validated['category_type'],
            is_active=True,
        ).exists()
        if exists:
            raise ValidationError({'name': 'You already have a category with this name and type.'})

        return CategoryRepository.create(validated)

    @staticmethod
    def update_category(category_id, user, data: dict):
        category = CategoryRepository.get_by_id(category_id, user)
        if not category:
            raise NotFound({'detail': 'Category not found.'})

        # Users cannot modify system categories
        if category.user is None:
            raise PermissionDenied({'detail': 'System categories cannot be modified.'})

        # Users can only edit their own categories
        if category.user != user:
            raise PermissionDenied({'detail': 'You do not own this category.'})

        serializer = CategoryCreateSerializer(data=data, partial=True)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        return CategoryRepository.update(category, serializer.validated_data)

    @staticmethod
    def delete_category(category_id, user):
        category = CategoryRepository.get_by_id(category_id, user)
        if not category:
            raise NotFound({'detail': 'Category not found.'})

        if category.user is None:
            raise PermissionDenied({'detail': 'System categories cannot be deleted.'})

        if category.user != user:
            raise PermissionDenied({'detail': 'You do not own this category.'})

        CategoryRepository.soft_delete(category)
        return {'detail': 'Category deleted successfully.'}
