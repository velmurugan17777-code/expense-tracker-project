from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound

from .services import CategoryService
from .serializers import CategorySerializer


class CategoryListCreateView(APIView):
    """
    GET  /api/categories/        — List all categories visible to the user.
    POST /api/categories/        — Create a new personal category.
    Optional query param: ?type=INCOME or ?type=EXPENSE
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category_type = request.query_params.get('type')
        categories = CategoryService.list_categories(request.user, category_type)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            category = CategoryService.create_category(request.user, request.data)
            serializer = CategorySerializer(category)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):
    """
    GET    /api/categories/<id>/ — Retrieve a single category.
    PATCH  /api/categories/<id>/ — Update a personal category.
    DELETE /api/categories/<id>/ — Soft-delete a personal category.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            category = CategoryService.get_category(pk, request.user)
            serializer = CategorySerializer(category)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response(e.detail, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            category = CategoryService.update_category(pk, request.user, request.data)
            serializer = CategorySerializer(category)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (ValidationError, PermissionDenied, NotFound) as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            result = CategoryService.delete_category(pk, request.user)
            return Response(result, status=status.HTTP_200_OK)
        except (PermissionDenied, NotFound) as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
