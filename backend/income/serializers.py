from rest_framework import serializers
from .models import Income


class IncomeSerializer(serializers.ModelSerializer):
    """
    Read serializer — returns full income data with nested category name.
    """
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Income
        fields = (
            'id', 'title', 'amount', 'date', 'description',
            'source', 'recurrence', 'category', 'category_name',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'category_name')

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None


class IncomeCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer — accepts income data for create/update.
    'user' is never accepted from the client — injected by the service.
    """
    class Meta:
        model = Income
        fields = ('title', 'amount', 'date', 'description', 'source', 'recurrence', 'category')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate_title(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Title must be at least 2 characters.')
        return value.strip()
