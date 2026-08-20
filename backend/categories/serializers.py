from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for reading Category data.
    Returns full Category details including user-owned flag.
    """
    is_system = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'category_type', 'icon',
            'color', 'is_active', 'is_system', 'created_at',
        )
        read_only_fields = ('id', 'created_at', 'is_system')

    def get_is_system(self, obj):
        """True if this is a system-wide category (no owner)."""
        return obj.user is None


class CategoryCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating / updating a Category.
    'user' is NOT in fields — it's injected by the service layer from request.user.
    """
    class Meta:
        model = Category
        fields = ('name', 'category_type', 'icon', 'color')

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Category name must be at least 2 characters.'
            )
        return value.strip()
