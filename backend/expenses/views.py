from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, NotFound

from .services import ExpenseService
from .serializers import ExpenseSerializer


class ExpenseListCreateView(APIView):
    """
    GET  /api/expenses/  — Paginated list with optional filters.
    POST /api/expenses/  — Create a new expense record.
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

        result = ExpenseService.list_expenses(request.user, filters, page, page_size)
        serializer = ExpenseSerializer(result['results'], many=True)
        return Response({
            'count':       result['count'],
            'page':        result['page'],
            'page_size':   result['page_size'],
            'total_pages': result['total_pages'],
            'results':     serializer.data,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            expense = ExpenseService.create_expense(request.user, request.data)
            serializer = ExpenseSerializer(expense)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)


class ExpenseDetailView(APIView):
    """
    GET    /api/expenses/<uuid>/
    PATCH  /api/expenses/<uuid>/
    DELETE /api/expenses/<uuid>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            expense = ExpenseService.get_expense(pk, request.user)
            serializer = ExpenseSerializer(expense)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            expense = ExpenseService.update_expense(pk, request.user, request.data)
            serializer = ExpenseSerializer(expense)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (ValidationError, NotFound) as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            result = ExpenseService.delete_expense(pk, request.user)
            return Response(result, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)


class ExpenseSummaryView(APIView):
    """
    GET /api/expenses/summary/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = ExpenseService.get_summary(request.user)
        return Response(summary, status=status.HTTP_200_OK)
