from django.urls import path
from . import views

urlpatterns = [
    path('',           views.IncomeListCreateView.as_view(), name='income-list-create'),
    path('summary/',   views.IncomeSummaryView.as_view(),    name='income-summary'),
    path('<uuid:pk>/', views.IncomeDetailView.as_view(),     name='income-detail'),
]
