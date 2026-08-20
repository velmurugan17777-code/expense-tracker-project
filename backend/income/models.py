import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class Income(models.Model):
    """
    Income model representing a single income transaction.

    Relationships (all UUID-to-UUID):
    - user     → accounts.User  (UUID FK)
    - category → categories.Category (UUID FK)

    Cascade rule: when user is deleted, all income records are deleted.
    """

    class RecurrenceType(models.TextChoices):
        NONE = 'NONE', 'None'
        DAILY = 'DAILY', 'Daily'
        WEEKLY = 'WEEKLY', 'Weekly'
        MONTHLY = 'MONTHLY', 'Monthly'
        YEARLY = 'YEARLY', 'Yearly'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='incomes',
    )
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incomes',
    )

    title = models.CharField(max_length=200)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date = models.DateField()
    description = models.TextField(blank=True, default='')
    source = models.CharField(max_length=100, blank=True, default='')
    recurrence = models.CharField(
        max_length=10,
        choices=RecurrenceType.choices,
        default=RecurrenceType.NONE,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'income'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f"{self.title} — {self.amount} ({self.date})"
