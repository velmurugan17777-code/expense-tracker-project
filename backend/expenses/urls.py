from django.urls import path
from . import views

urlpatterns = [
    path('',           views.ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('summary/',   views.ExpenseSummaryView.as_view(),    name='expense-summary'),
    path('<uuid:pk>/', views.ExpenseDetailView.as_view(),     name='expense-detail'),
]
