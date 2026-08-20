from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .services import ReportService


class CSVExportView(APIView):
    """
    GET /api/reports/export/csv/
    Downloads a CSV file with all transactions.
    Optional filters: ?year=2026&month=7
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            year = request.query_params.get('year')
            month = request.query_params.get('month')
            
            if year: year = int(year)
            if month: month = int(month)

            return ReportService.generate_csv_report(request.user, year, month)
        except ValueError:
            return Response({'error': 'Invalid year or month format.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExcelExportView(APIView):
    """
    GET /api/reports/export/excel/
    Downloads a styled Excel (.xlsx) file with transactions + summary sheet.
    Optional filters: ?year=2026&month=7
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            year = request.query_params.get('year')
            month = request.query_params.get('month')

            if year: year = int(year)
            if month: month = int(month)

            return ReportService.generate_excel_report(request.user, year, month)
        except ValueError:
            return Response({'error': 'Invalid year or month format.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
