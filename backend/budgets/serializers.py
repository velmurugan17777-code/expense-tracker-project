from rest_framework import serializers
from .models import Budget, CategoryBudget


class CategoryBudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    category_icon = serializers.SerializerMethodField()
    category_color = serializers.SerializerMethodField()

    class Meta:
        model = CategoryBudget
        fields = (
            'id', 'category', 'category_name', 'category_icon', 'category_color',
            'amount', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'category_name', 'category_icon', 'category_color')

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_category_icon(self, obj):
        return obj.category.icon if obj.category else None

    def get_category_color(self, obj):
        return obj.category.color if obj.category else None


class BudgetSerializer(serializers.ModelSerializer):
    category_budgets = CategoryBudgetSerializer(many=True, read_only=True)

    class Meta:
        model = Budget
        fields = (
            'id', 'month', 'year', 'amount', 'category_budgets',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'category_budgets')


class BudgetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ('month', 'year', 'amount')

    def validate_month(self, value):
        if not 1 <= value <= 12:
            raise serializers.ValidationError('Month must be between 1 and 12.')
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value


class CategoryBudgetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryBudget
        fields = ('category', 'amount')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value
