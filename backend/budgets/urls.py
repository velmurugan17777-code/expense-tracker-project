from django.urls import path
from . import views

urlpatterns = [
    # Main Budget routes
    path('', views.BudgetListCreateView.as_view(), name='budget-list-create'),
    path('<uuid:pk>/', views.BudgetDetailView.as_view(), name='budget-detail'),
    
    # Nested Category Budget routes
    path('<uuid:budget_id>/categories/', views.CategoryBudgetListCreateView.as_view(), name='category-budget-create'),
    path('<uuid:budget_id>/categories/<uuid:cb_id>/', views.CategoryBudgetDetailView.as_view(), name='category-budget-detail'),
]
