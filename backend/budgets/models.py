import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal

class Budget(models.Model):
    """
    Monthly Budget model. Tracks total spending limit for a specific month/year.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='budgets'
    )
    month = models.IntegerField(validators=[MinValueValidator(1)])
    year = models.IntegerField(validators=[MinValueValidator(2000)])
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budgets'
        ordering = ['-year', '-month']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'month', 'year'], 
                condition=models.Q(is_active=True),
                name='unique_active_budget_per_month'
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.month}/{self.year} - {self.amount}"


class CategoryBudget(models.Model):
    """
    Specific budget limit for a category within a given month.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(
        Budget, 
        on_delete=models.CASCADE, 
        related_name='category_budgets'
    )
    category = models.ForeignKey(
        'categories.Category', 
        on_delete=models.CASCADE, 
        related_name='budgets'
    )
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'category_budgets'
        constraints = [
            models.UniqueConstraint(
                fields=['budget', 'category'], 
                condition=models.Q(is_active=True),
                name='unique_active_category_budget'
            )
        ]

    def __str__(self):
        return f"{self.category.name} limit - {self.amount}"
