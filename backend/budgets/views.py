from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, NotFound

from .services import BudgetService
from .serializers import BudgetSerializer, CategoryBudgetSerializer


class BudgetListCreateView(APIView):
    """
    GET  /api/budgets/ — List budgets (optional ?year=2026)
    POST /api/budgets/ — Create a new monthly budget
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get('year')
        budgets = BudgetService.list_budgets(request.user, year)
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            budget = BudgetService.create_budget(request.user, request.data)
            serializer = BudgetSerializer(budget)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)


class BudgetDetailView(APIView):
    """
    GET    /api/budgets/<uuid>/
    PATCH  /api/budgets/<uuid>/
    DELETE /api/budgets/<uuid>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            budget = BudgetService.get_budget(pk, request.user)
            serializer = BudgetSerializer(budget)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            budget = BudgetService.update_budget(pk, request.user, request.data)
            serializer = BudgetSerializer(budget)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (ValidationError, NotFound) as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            result = BudgetService.delete_budget(pk, request.user)
            return Response(result, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)


class CategoryBudgetListCreateView(APIView):
    """
    POST /api/budgets/<budget_id>/categories/ — Add a category limit to a budget
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, budget_id):
        try:
            cb = BudgetService.create_category_budget(budget_id, request.user, request.data)
            serializer = CategoryBudgetSerializer(cb)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except (ValidationError, NotFound) as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)


class CategoryBudgetDetailView(APIView):
    """
    PATCH  /api/budgets/<budget_id>/categories/<cb_id>/
    DELETE /api/budgets/<budget_id>/categories/<cb_id>/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, budget_id, cb_id):
        try:
            cb = BudgetService.update_category_budget(budget_id, cb_id, request.user, request.data)
            serializer = CategoryBudgetSerializer(cb)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (ValidationError, NotFound) as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, budget_id, cb_id):
        try:
            result = BudgetService.delete_category_budget(budget_id, cb_id, request.user)
            return Response(result, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)
