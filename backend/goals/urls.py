from django.urls import path
from .views import SavingsGoalListCreateView, SavingsGoalDetailView

urlpatterns = [
    path('', SavingsGoalListCreateView.as_view(), name='goals-list-create'),
    path('<uuid:pk>/', SavingsGoalDetailView.as_view(), name='goals-detail'),
]
