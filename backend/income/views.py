from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, NotFound

from .services import IncomeService
from .serializers import IncomeSerializer


class IncomeListCreateView(APIView):
    """
    GET  /api/income/  — Paginated list with optional filters.
    POST /api/income/  — Create a new income record.

    Query params (GET):
      ?search=salary
      ?date_from=2026-01-01&date_to=2026-12-31
      ?category_id=<uuid>
      ?ordering=amount | -amount | date | -date
      ?page=1&page_size=10
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = {
            'search':      request.query_params.get('search'),
            'date_from':   request.query_params.get('date_from'),
            'date_to':     request.query_params.get('date_to'),
            'category_id': request.query_params.get('category_id'),
            'ordering':    request.query_params.get('ordering'),
        }
        page      = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        result = IncomeService.list_income(request.user, filters, page, page_size)
        serializer = IncomeSerializer(result['results'], many=True)
        return Response({
            'count':       result['count'],
            'page':        result['page'],
            'page_size':   result['page_size'],
            'total_pages': result['total_pages'],
            'results':     serializer.data,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            income = IncomeService.create_income(request.user, request.data)
            serializer = IncomeSerializer(income)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)


class IncomeDetailView(APIView):
    """
    GET    /api/income/<uuid>/ — Retrieve a single income record.
    PATCH  /api/income/<uuid>/ — Partial update.
    DELETE /api/income/<uuid>/ — Soft delete.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            income = IncomeService.get_income(pk, request.user)
            serializer = IncomeSerializer(income)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            income = IncomeService.update_income(pk, request.user, request.data)
            serializer = IncomeSerializer(income)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (ValidationError, NotFound) as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            result = IncomeService.delete_income(pk, request.user)
            return Response(result, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)


class IncomeSummaryView(APIView):
    """
    GET /api/income/summary/ — Total income + monthly breakdown for charts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = IncomeService.get_summary(request.user)
        return Response(summary, status=status.HTTP_200_OK)
