from income.repositories import IncomeRepository
from expenses.repositories import ExpenseRepository
from budgets.repositories import BudgetRepository
from income.serializers import IncomeSerializer
from expenses.serializers import ExpenseSerializer
from datetime import date

class DashboardService:
    """
    Dashboard Service.
    Aggregates data across Income and Expense modules to serve the frontend Dashboard.
    Does not write to any DB, purely data aggregation.
    """

    @staticmethod
    def get_dashboard_summary(user):
        # 1. Get totals
        total_income = IncomeRepository.get_total_for_user(user)
        total_expenses = ExpenseRepository.get_total_for_user(user)
        balance = total_income - total_expenses

        # 2. Get recent transactions (last 5 of each, combined and sorted)
        # In a real enterprise system, we might query both and sort in python, 
        # or use a raw SQL union. Here we query both, combine, sort by date, and take top 5.
        recent_income = IncomeRepository.get_all_for_user(user).order_by('-date')[:5]
        recent_expenses = ExpenseRepository.get_all_for_user(user).order_by('-date')[:5]

        # Serialize
        inc_data = IncomeSerializer(recent_income, many=True).data
        # Tag them with a type for the frontend
        for item in inc_data:
            item['transaction_type'] = 'INCOME'

        exp_data = ExpenseSerializer(recent_expenses, many=True).data
        for item in exp_data:
            item['transaction_type'] = 'EXPENSE'

        # Combine and sort by date descending
        all_transactions = inc_data + exp_data
        all_transactions.sort(key=lambda x: x['date'], reverse=True)
        recent_transactions = all_transactions[:5]

        # 3. Monthly aggregates for the current year (for charting)
        current_year = date.today().year
        monthly_income = IncomeRepository.get_monthly_totals(user, current_year)
        monthly_expenses = ExpenseRepository.get_monthly_totals(user, current_year)

        # Structure monthly data: { "Jan 2026": { income: 0, expense: 0 } }
        monthly_chart = {}
        
        for inc in monthly_income:
            month_str = inc['month'].strftime('%b %Y')
            monthly_chart.setdefault(month_str, {'income': 0, 'expense': 0})
            monthly_chart[month_str]['income'] = float(inc['total'])

        for exp in monthly_expenses:
            month_str = exp['month'].strftime('%b %Y')
            monthly_chart.setdefault(month_str, {'income': 0, 'expense': 0})
            monthly_chart[month_str]['expense'] = float(exp['total'])

        # Convert to list for React (Recharts friendly)
        chart_data = [
            {'month': m, 'income': data['income'], 'expense': data['expense']}
            for m, data in monthly_chart.items()
        ]
        # Sort chronologically based on python's datetime if needed, 
        # but db's OrderBy month usually keeps them in order, though dict keys might scramble it in older pythons.
        # Python 3.7+ preserves dict insertion order, so if DB ordered it, it's mostly fine.

        # 4. Current Month Budget Status
        today = date.today()
        current_month = today.month
        
        current_budget_obj = BudgetRepository.get_by_month_year(user, current_month, current_year)
        budget_status = None
        alerts = []

        if current_budget_obj:
            budget_limit = float(current_budget_obj.amount)
            current_month_expenses = ExpenseRepository.get_total_for_month(user, current_month, current_year)
            
            percentage = 0
            if budget_limit > 0:
                percentage = (current_month_expenses / budget_limit) * 100
                
            level = "Safe"
            if percentage >= 100:
                level = "Exceeded"
                alerts.append({"type": "danger", "message": f"Budget Exceeded! You have spent {percentage:.1f}% of your monthly budget."})
            elif percentage >= 90:
                level = "Alert"
                alerts.append({"type": "warning", "message": f"Budget Alert! You have spent {percentage:.1f}% of your monthly budget."})
            elif percentage >= 70:
                level = "Warning"
                alerts.append({"type": "info", "message": f"Budget Warning. You have spent {percentage:.1f}% of your monthly budget."})
                
            budget_status = {
                "limit": budget_limit,
                "spent": current_month_expenses,
                "percentage": round(percentage, 2),
                "level": level
            }

        return {
            'balance': balance,
            'total_income': total_income,
            'total_expenses': total_expenses,
            'recent_transactions': recent_transactions,
            'chart_data': chart_data,
            'budget_status': budget_status,
            'alerts': alerts
        }
