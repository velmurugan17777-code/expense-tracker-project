from django.urls import path
from . import views

urlpatterns = [
    path('advice/', views.AIAdviceView.as_view(), name='ai-advice'),
]
