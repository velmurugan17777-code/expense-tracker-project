import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class Expense(models.Model):
    """
    Expense model representing a single expense transaction.

    Relationships:
    - user     → accounts.User       (UUID FK)
    - category → categories.Category (UUID FK)
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
        related_name='expenses',
    )
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
    )

    title = models.CharField(max_length=200)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date = models.DateField()
    description = models.TextField(blank=True, default='')
    payee = models.CharField(max_length=100, blank=True, default='')
    recurrence = models.CharField(
        max_length=10,
        choices=RecurrenceType.choices,
        default=RecurrenceType.NONE,
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recurring_children',
        help_text="The original expense this was generated from"
    )
    next_recurrence_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f"{self.title} — {self.amount} ({self.date})"
