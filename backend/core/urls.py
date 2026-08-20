from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse
import datetime

admin.site.site_header = getattr(settings, 'ADMIN_SITE_HEADER', 'SmartTracker Admin')
admin.site.site_title = getattr(settings, 'ADMIN_SITE_TITLE', 'SmartTracker')
admin.site.index_title = getattr(settings, 'ADMIN_INDEX_TITLE', 'Administration')


def health_check(request):
    """Health check endpoint for Docker/load-balancer probing."""
    return JsonResponse({
        'status': 'ok',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'service': 'smarttracker-backend'
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/accounts/',   include('accounts.urls')),
    path('api/categories/', include('categories.urls')),
    path('api/income/',     include('income.urls')),
    path('api/expenses/',   include('expenses.urls')),
    path('api/budgets/',    include('budgets.urls')),
    path('api/dashboard/',  include('dashboard.urls')),
    path('api/reports/',    include('reports.urls')),
    path('api/goals/',      include('goals.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/ai/',         include('ai_engine.urls')),
]
