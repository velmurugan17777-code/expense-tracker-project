import datetime
import calendar
from decimal import Decimal
from budgets.repositories import BudgetRepository
from expenses.repositories import ExpenseRepository
from income.repositories import IncomeRepository


class AIEngineService:
    """
    AI Engine Service.
    A heuristic-based rule engine that simulates AI financial advice.
    """

    @staticmethod
    def generate_advice(user):
        today = datetime.date.today()
        month = today.month
        year = today.year

        # ─── Gather Data ───────────────────────────────────────────────
        # Current month expenses
        last_day = calendar.monthrange(year, month)[1]
        monthly_filters = {
            'date_from': f"{year}-{month:02d}-01",
            'date_to': f"{year}-{month:02d}-{last_day:02d}",
        }
        expenses_this_month = list(ExpenseRepository.get_all_for_user(user, monthly_filters))
        total_spent = sum(Decimal(str(e.amount)) for e in expenses_this_month)

        # Previous month expenses (for comparison)
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        prev_last_day = calendar.monthrange(prev_year, prev_month)[1]
        prev_filters = {
            'date_from': f"{prev_year}-{prev_month:02d}-01",
            'date_to': f"{prev_year}-{prev_month:02d}-{prev_last_day:02d}",
        }
        expenses_prev_month = list(ExpenseRepository.get_all_for_user(user, prev_filters))
        total_spent_prev = sum(Decimal(str(e.amount)) for e in expenses_prev_month)

        # Income this month
        income_this_month = list(IncomeRepository.get_all_for_user(user, monthly_filters))
        total_income = sum(Decimal(str(i.amount)) for i in income_this_month)

        # Budget
        budget = BudgetRepository.get_by_month_year(user, month, year)
        budget_amount = Decimal(str(budget.amount)) if budget else Decimal('0')

        # ─── Analysis ──────────────────────────────────────────────────
        advice = []
        status = "GOOD"
        score = 100  # Start with perfect financial health score

        # 1. Budget vs Actual
        if budget:
            pct = (total_spent / budget_amount * 100) if budget_amount else 0
            if total_spent > budget_amount:
                status = "CRITICAL"
                score -= 30
                over = total_spent - budget_amount
                advice.append({
                    "icon": "🚨",
                    "type": "critical",
                    "title": "Budget Exceeded",
                    "text": f"You've exceeded your ${budget_amount:.2f} budget by ${over:.2f}. Halt non-essential spending immediately."
                })
            elif pct >= 80:
                status = "WARNING"
                score -= 15
                advice.append({
                    "icon": "⚠️",
                    "type": "warning",
                    "title": "Budget Warning",
                    "text": f"You've used {pct:.0f}% of your ${budget_amount:.2f} budget. Limit discretionary spending for the rest of the month."
                })
            else:
                advice.append({
                    "icon": "✅",
                    "type": "success",
                    "title": "Budget On Track",
                    "text": f"Great job! You've used {pct:.0f}% of your ${budget_amount:.2f} budget — you're on track."
                })
        else:
            score -= 10
            advice.append({
                "icon": "💡",
                "type": "info",
                "title": "No Budget Set",
                "text": "You haven't set a budget for this month. Setting a budget is the first step to financial freedom."
            })

        # 2. Month-over-Month Comparison
        if total_spent_prev > 0:
            change_pct = ((total_spent - total_spent_prev) / total_spent_prev) * 100
            if change_pct > 20:
                score -= 10
                advice.append({
                    "icon": "📈",
                    "type": "warning",
                    "title": "Spending Increased",
                    "text": f"Your spending is up {change_pct:.0f}% compared to last month (${total_spent_prev:.2f} → ${total_spent:.2f}). Review what changed."
                })
            elif change_pct < -10:
                score += 5
                advice.append({
                    "icon": "📉",
                    "type": "success",
                    "title": "Spending Decreased",
                    "text": f"Your spending dropped {abs(change_pct):.0f}% vs last month (${total_spent_prev:.2f} → ${total_spent:.2f}). Great discipline!"
                })

        # 3. Category Spending Habits
        category_spending = {}
        for exp in expenses_this_month:
            cat_name = exp.category.name if exp.category else "Uncategorized"
            category_spending[cat_name] = category_spending.get(cat_name, Decimal('0')) + Decimal(str(exp.amount))

        if category_spending:
            top_cat = max(category_spending, key=category_spending.get)
            top_amt = category_spending[top_cat]
            pct_of_budget = (top_amt / budget_amount * 100) if budget_amount else 0

            if budget_amount and pct_of_budget > 40:
                score -= 10
                advice.append({
                    "icon": "🏷️",
                    "type": "warning",
                    "title": f"High Spending: {top_cat}",
                    "text": f"'{top_cat}' accounts for {pct_of_budget:.0f}% of your budget (${top_amt:.2f}). Explore cheaper alternatives."
                })
            else:
                advice.append({
                    "icon": "📊",
                    "type": "info",
                    "title": "Top Expense Category",
                    "text": f"Your biggest spending category this month is '{top_cat}' at ${top_amt:.2f}."
                })

        # 4. Savings Rate
        if total_income > 0:
            savings = total_income - total_spent
            savings_rate = (savings / total_income * 100)
            if savings_rate >= 20:
                advice.append({
                    "icon": "🏦",
                    "type": "success",
                    "title": "Excellent Savings Rate",
                    "text": f"You're saving {savings_rate:.0f}% of your income this month (${savings:.2f}). Experts recommend 20%+."
                })
            elif savings_rate >= 0:
                score -= 5
                advice.append({
                    "icon": "💰",
                    "type": "info",
                    "title": "Savings Rate",
                    "text": f"You're saving {savings_rate:.0f}% of income (${savings:.2f}). Try to reach 20% by cutting discretionary spending."
                })
            else:
                score -= 20
                status = "CRITICAL"
                advice.append({
                    "icon": "💸",
                    "type": "critical",
                    "title": "Spending More Than Earning",
                    "text": f"Your expenses (${total_spent:.2f}) exceed your income (${total_income:.2f}) by ${abs(savings):.2f}. Urgent action needed."
                })

        # 5. Prediction for month-end
        day_of_month = today.day
        days_in_month = 30
        if day_of_month > 0 and total_spent > 0:
            daily_avg = total_spent / day_of_month
            projected = daily_avg * days_in_month
            if budget_amount and projected > budget_amount:
                score -= 5
                advice.append({
                    "icon": "🔮",
                    "type": "warning",
                    "title": "Month-End Prediction",
                    "text": f"At your current pace, you'll spend ${projected:.2f} by month-end vs your ${budget_amount:.2f} budget. Slow down."
                })
            elif budget_amount:
                advice.append({
                    "icon": "🔮",
                    "type": "info",
                    "title": "Month-End Prediction",
                    "text": f"At your current pace, you're projected to spend ${projected:.2f} by month-end — within your ${budget_amount:.2f} budget."
                })

        score = max(0, min(100, score))

        return {
            'status': status,
            'score': score,
            'summary': "AI Financial Analysis Complete",
            'period': {'month': month, 'year': year},
            'metrics': {
                'total_income': float(total_income),
                'total_spent': float(total_spent),
                'total_spent_prev_month': float(total_spent_prev),
                'budget': float(budget_amount),
                'savings': float(total_income - total_spent),
            },
            'advice': advice,
        }
