from django.urls import path
from . import views

urlpatterns = [
    path('export/csv/', views.CSVExportView.as_view(), name='export-csv'),
    path('export/excel/', views.ExcelExportView.as_view(), name='export-excel'),
]
