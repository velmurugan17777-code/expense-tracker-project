from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .services import AIEngineService


class AIAdviceView(APIView):
    """
    GET /api/ai/advice/
    Returns AI-generated advice based on user spending habits vs budget.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            advice = AIEngineService.generate_advice(request.user)
            return Response(advice, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
