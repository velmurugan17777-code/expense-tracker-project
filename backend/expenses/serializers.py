from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """
    Read serializer — returns full expense data with nested category name.
    """
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = (
            'id', 'title', 'amount', 'date', 'description',
            'payee', 'recurrence', 'category', 'category_name',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'category_name')

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer — validates input and ignores user field.
    """
    class Meta:
        model = Expense
        fields = ('title', 'amount', 'date', 'description', 'payee', 'recurrence', 'category')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate_title(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Title must be at least 2 characters.')
        return value.strip()
