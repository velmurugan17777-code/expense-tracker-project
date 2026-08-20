from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .services import DashboardService


class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/
    Returns the aggregated summary for the main Dashboard view.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            summary = DashboardService.get_dashboard_summary(request.user)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
