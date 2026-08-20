import uuid
from django.db import models
from django.conf import settings


class Category(models.Model):
    """
    Category model for classifying Income and Expense transactions.
    - UUID primary key for security and distributed system compatibility.
    - user=None means system-wide default category (visible to all).
    - user=<UUID> means a personal category owned by that user.
    """

    class CategoryType(models.TextChoices):
        INCOME = 'INCOME', 'Income'
        EXPENSE = 'EXPENSE', 'Expense'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='categories',
        help_text='Leave blank for system-wide categories.'
    )
    name = models.CharField(max_length=100)
    category_type = models.CharField(
        max_length=10,
        choices=CategoryType.choices,
        default=CategoryType.EXPENSE,
    )
    icon = models.CharField(max_length=50, blank=True, default='tag')
    color = models.CharField(max_length=7, blank=True, default='#6B7280')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'name', 'category_type'],
                name='unique_user_category_type'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'category_type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.category_type})"
