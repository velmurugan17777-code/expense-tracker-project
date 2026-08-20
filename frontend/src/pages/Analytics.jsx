import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import api from '../services/api';

const COLORS = ['#FF6B00','#E53935','#1565C0','#2E7D32','#6A1B9A','#F57C00','#00838F'];
const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ monthly: [], categories: [] });
  const [tab, setTab] = useState('monthly');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, expRes] = await Promise.all([
          api.get('/dashboard/'),
          api.get('/expenses/?limit=1000'), // Fetch enough to build category stats
        ]);
        
        const monthly = dashRes.data.chart_data || [];
        
        const expenses = expRes.data?.results || expRes.data || [];
        const catMap = {};
        expenses.forEach(e => {
          const cat = e.category_name || 'Uncategorised';
          catMap[cat] = (catMap[cat] || 0) + parseFloat(e.amount || 0);
        });
        
        const categories = Object.entries(catMap)
          .map(([name, total]) => ({ category__name: name, total: parseFloat(total.toFixed(2)) }))
          .sort((a, b) => b.total - a.total);
          
        setData({ monthly, categories });
      } catch (err) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const monthly = data.monthly || [];
  const categories = data.categories || [];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header mb-4">
        <h1 className="page-title d-flex align-items-center gap-2"><FiActivity /> Analytics</h1>
        <p className="page-subtitle">Deep dive into your financial patterns</p>
      </div>

      {/* Tab selector */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {[['monthly', 'Monthly Trend'], ['category', 'By Category'], ['area', 'Area Chart']].map(([k, l]) => (
          <button key={k} className={`btn btn-sm fw-600 ${tab === k ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ borderRadius: 10 }} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header fw-700">
              {tab === 'monthly' ? 'Monthly Income vs Expense' : tab === 'category' ? 'Category Breakdown' : 'Cumulative Area Chart'}
            </div>
            <div className="card-body p-3">
              {loading ? <div className="skeleton" style={{ height: 300 }} /> : (
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {tab === 'monthly' ? (
                      <BarChart data={monthly} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => [fmt(v), '']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#2E7D32" radius={[4,4,0,0]} />
                        <Bar dataKey="expense" name="Expense" fill="#E53935" radius={[4,4,0,0]} />
                      </BarChart>
                    ) : tab === 'area' ? (
                      <AreaChart data={monthly} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <defs>
                          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E53935" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => [fmt(v), '']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <Legend />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#2E7D32" fill="url(#incGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#E53935" fill="url(#expGrad)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <PieChart>
                        <Pie data={categories} cx="50%" cy="50%" outerRadius={110} dataKey="total" nameKey="category__name" paddingAngle={3}>
                          {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => [fmt(v), '']} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{v}</span>} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Stats */}
        {!loading && categories.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header fw-700">Category Summary</div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr><th>Category</th><th>Amount</th><th>Share</th><th>Visual</th></tr>
                    </thead>
                    <tbody>
                      {categories.map((c, i) => {
                        const total = categories.reduce((s, x) => s + (x.total || 0), 0);
                        const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
                        return (
                          <tr key={i}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle" style={{ width: 10, height: 10, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                <span className="fw-600">{c.category__name || 'Other'}</span>
                              </div>
                            </td>
                            <td className="fw-600" style={{ color: '#E53935' }}>{fmt(c.total)}</td>
                            <td><span className="fw-700">{pct}%</span></td>
                            <td style={{ width: '30%' }}>
                              <div className="budget-progress">
                                <div className="budget-bar" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
