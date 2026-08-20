import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiTarget, FiArrowUpRight, FiArrowDownRight, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';

const PIE_COLORS = ['#FF6B00', '#E53935', '#1565C0', '#2E7D32', '#6A1B9A', '#F57C00', '#00838F'];

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0, savings_rate: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [aiAdvice, setAiAdvice] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, expRes] = await Promise.allSettled([
        api.get('/dashboard/'),
        api.get('/expenses/?limit=1000') // For category pie chart
      ]);
      
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data;
        const inc = d.total_income || 0;
        const exp = d.total_expenses || 0;
        const rate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;
        
        setSummary({ 
          total_income: inc, 
          total_expenses: exp, 
          balance: d.balance || 0, 
          savings_rate: rate 
        });
        
        setMonthlyData(d.chart_data || []);
        
        // Map recent transactions from dashboard API
        const txs = (d.recent_transactions || []).map(tx => ({
          ...tx,
          tx_type: tx.transaction_type === 'INCOME' ? 'income' : 'expense',
        }));
        setRecentTx(txs);
        
        // Map budget
        if (d.budget_status) {
          setBudgets([{
            name: 'Overall Monthly Budget',
            limit: d.budget_status.limit,
            spent: d.budget_status.spent
          }]);
        } else {
          setBudgets([]);
        }
      }
      
      if (expRes.status === 'fulfilled') {
        const expenses = expRes.value.data?.results || expRes.value.data || [];
        const catMap = {};
        expenses.forEach(e => {
          const cat = e.category_name || 'Uncategorised';
          catMap[cat] = (catMap[cat] || 0) + parseFloat(e.amount || 0);
        });
        const categories = Object.entries(catMap)
          .map(([name, total]) => ({ category__name: name, total: parseFloat(total.toFixed(2)) }))
          .sort((a, b) => b.total - a.total);
        setCategoryData(categories);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Income',    value: summary.total_income,   cls: 'stat-card-income',  icon: FiTrendingUp,   suffix: '▲ This month' },
    { label: 'Total Expenses',  value: summary.total_expenses, cls: 'stat-card-expense', icon: FiTrendingDown, suffix: '▼ This month' },
    { label: 'Balance',         value: summary.balance,        cls: 'stat-card-balance', icon: FiDollarSign,   suffix: 'Available now' },
    { label: 'Savings Rate',    value: `${summary.savings_rate}%`, cls: 'stat-card-saving', icon: FiTarget, suffix: 'Of income saved' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle mb-0">Hello, {user?.first_name || 'there'}! Here's your financial overview.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/expenses" className="btn btn-sm btn-outline-primary fw-600 d-flex align-items-center gap-1" style={{ borderRadius: 10 }}>
            <FiPlus size={13} /> Add Expense
          </Link>
          <Link to="/income" className="btn btn-sm btn-primary fw-600 d-flex align-items-center gap-1" style={{ borderRadius: 10 }}>
            <FiPlus size={13} /> Add Income
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? <SkeletonLoader count={4} /> : (
        <div className="row g-3 mb-4">
          {statCards.map(({ label, value, cls, icon: Icon, suffix }) => (
            <div key={label} className="col-6 col-lg-3">
              <div className={`stat-card ${cls}`}>
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                    <div className="fw-800 mt-1" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>{typeof value === 'string' ? value : fmt(value)}</div>
                  </div>
                  <div className="stat-icon"><Icon size={20} /></div>
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{suffix}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row g-3 mb-4">
        {/* Income vs Expense Bar Chart */}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>Income vs Expense</span>
              <span className="badge" style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--primary)', fontSize: '0.7rem' }}>Monthly</span>
            </div>
            <div className="card-body p-3">
              {loading ? <div className="skeleton" style={{ height: 260 }} /> : (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [fmt(v), '']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#2E7D32" radius={[4,4,0,0]} />
                      <Bar dataKey="expense" name="Expense" fill="#E53935" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-header">Expenses by Category</div>
            <div className="card-body p-3">
              {loading ? <div className="skeleton" style={{ height: 260 }} /> : categoryData.length === 0 ? (
                <div className="text-center text-muted py-5">No expense data yet.</div>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="total" nameKey="category__name" paddingAngle={3}>
                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [fmt(v), '']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {/* Recent Transactions */}
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>Recent Transactions</span>
              <Link to="/expenses" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
            </div>
            <div className="card-body p-3">
              {loading ? <SkeletonLoader type="row" count={4} /> : recentTx.length === 0 ? (
                <div className="text-center text-muted py-4">No transactions yet. <Link to="/expenses">Add one</Link>.</div>
              ) : (
                recentTx.map((tx, i) => (
                  <div key={i} className="tx-item">
                    <div className="tx-icon" style={{ background: tx.tx_type === 'income' ? '#E8F5E9' : '#FFEBEE', color: tx.tx_type === 'income' ? '#2E7D32' : '#E53935' }}>
                      {tx.tx_type === 'income' ? <FiArrowUpRight /> : <FiArrowDownRight />}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="fw-600" style={{ fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.title || 'Transaction'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.date} • {tx.category_name || tx.tx_type}</div>
                    </div>
                    <div className={tx.tx_type === 'income' ? 'tx-amount-income' : 'tx-amount-expense'} style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {tx.tx_type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>Budget Progress</span>
              <Link to="/budgets" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Manage →</Link>
            </div>
            <div className="card-body p-3">
              {loading ? <SkeletonLoader type="row" count={3} /> : budgets.length === 0 ? (
                <div className="text-center text-muted py-4">No budgets set. <Link to="/budgets">Create one</Link>.</div>
              ) : (
                budgets.map((b, i) => {
                  const pct = Math.min(100, Math.round(((b.spent || 0) / (b.limit || 1)) * 100));
                  const color = pct >= 100 ? '#E53935' : pct >= 80 ? '#FF6B00' : '#2E7D32';
                  return (
                    <div key={i} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-600" style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{b.name || b.category?.name || 'Budget'}</span>
                        <span style={{ fontSize: '0.8rem', color, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div className="budget-progress">
                        <div className="budget-bar" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmt(b.spent || 0)} spent</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmt(b.limit)} limit</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Advice Card */}
      {aiAdvice && (
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #FFF8F0, #FFF3E0)', borderColor: 'rgba(255,107,0,0.2)' }}>
          <div className="card-body p-3">
            <div className="d-flex align-items-start gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-xl flex-shrink-0" style={{ width: 44, height: 44, background: 'rgba(255,107,0,0.12)', fontSize: '1.3rem' }}>🤖</div>
              <div>
                <div className="fw-700 mb-1" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>AI Financial Advice</div>
                <p className="mb-0" style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.7 }}>{aiAdvice}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
