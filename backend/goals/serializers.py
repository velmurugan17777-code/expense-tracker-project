from rest_framework import serializers
from .models import SavingsGoal

class SavingsGoalSerializer(serializers.ModelSerializer):
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = ['id', 'title', 'target_amount', 'current_amount', 'target_date', 'is_completed', 'percentage', 'created_at']
        read_only_fields = ['id', 'created_at', 'percentage']

    def get_percentage(self, obj):
        if obj.target_amount > 0:
            return round((obj.current_amount / obj.target_amount) * 100, 2)
        return 0
