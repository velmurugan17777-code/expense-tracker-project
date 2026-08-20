from django.contrib import admin
from .models import SavingsGoal


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'target_amount', 'current_amount', 'target_date', 'is_completed')
    list_filter = ('is_completed',)
    search_fields = ('user__email', 'title')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
