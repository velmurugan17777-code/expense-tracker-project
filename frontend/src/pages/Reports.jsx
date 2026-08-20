import React, { useState, useEffect } from 'react';
import { FiDownload, FiFileText, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

const now = new Date();
const MONTHS = [
  { value: '', label: 'All Months' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
  })),
];

const PIE_COLORS = ['#FF6B00','#E53935','#1565C0','#2E7D32','#6A1B9A','#F57C00','#00838F','#AD1457'];

const Reports = () => {
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState('');
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState('');

  // Dashboard summary for the current year/month
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    balance: 0,
    chart_data: [],
  });

  // Raw expenses & income for the selected period (for category breakdown + transaction table)
  const [transactions, setTransactions] = useState([]);
  const [catBreakdown, setCatBreakdown] = useState([]);
  const [txLoading, setTxLoading]       = useState(false);

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    setLoading(true);
    setTxLoading(true);
    try {
      // 1. Dashboard summary (provides chart_data + totals)
      const dashRes = await api.get('/dashboard/');
      const d = dashRes.data;
      setSummary({
        total_income:   d.total_income   || 0,
        total_expenses: d.total_expenses || 0,
        balance:        d.balance        || 0,
        chart_data:     d.chart_data     || [],
      });

      // 2. Raw income + expense for the selected period
      const params = {};
      if (year)  params.year  = year;
      if (month) params.month = month;

      const [incRes, expRes] = await Promise.all([
        api.get('/income/',   { params }),
        api.get('/expenses/', { params }),
      ]);

      const incomes   = incRes.data?.results  || incRes.data  || [];
      const expenses  = expRes.data?.results  || expRes.data  || [];

      // Build unified transaction list
      const txList = [
        ...incomes.map(i => ({
          id:       i.id,
          date:     i.date,
          type:     'Income',
          title:    i.title,
          category: i.category_name || '—',
          amount:   parseFloat(i.amount),
        })),
        ...expenses.map(e => ({
          id:       e.id,
          date:     e.date,
          type:     'Expense',
          title:    e.title,
          category: e.category_name || '—',
          amount:   -parseFloat(e.amount),
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(txList);

      // Build category breakdown (expenses only)
      const catMap = {};
      expenses.forEach(e => {
        const cat = e.category_name || 'Uncategorised';
        catMap[cat] = (catMap[cat] || 0) + parseFloat(e.amount);
      });
      const catArr = Object.entries(catMap)
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
        .sort((a, b) => b.value - a.value);
      setCatBreakdown(catArr);

    } catch (_) {}
    finally { setLoading(false); setTxLoading(false); }
  };

  // Download CSV from the backend export endpoint
  const handleExportCSV = async () => {
    setExporting('csv');
    try {
      const params = {};
      if (year)  params.year  = year;
      if (month) params.month = month;

      const res = await api.get('/reports/export/csv/', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `smarttracker_report_${year || 'all'}_${month || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('CSV export failed. Please try again.');
    } finally { setExporting(''); }
  };

  // Download Excel from the backend export endpoint
  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const params = {};
      if (year)  params.year  = year;
      if (month) params.month = month;

      const res = await api.get('/reports/export/excel/', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `smarttracker_report_${year || 'all'}_${month || 'all'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Excel export failed. Please try again.');
    } finally { setExporting(''); }
  };

  const totalIncome   = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const netSavings    = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center gap-2"><FiFileText /> Reports</h1>
          <p className="page-subtitle">Generate and export your financial reports</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-outline-primary fw-600 d-flex align-items-center gap-2"
            style={{borderRadius:10}} onClick={handleExportCSV} disabled={!!exporting}>
            {exporting === 'csv'
              ? <span className="spinner-border spinner-border-sm"/>
              : <FiDownload size={14}/>}
            Export CSV
          </button>
          <button
            className="btn btn-success fw-600 d-flex align-items-center gap-2"
            style={{borderRadius:10}} onClick={handleExportExcel} disabled={!!exporting}>
            {exporting === 'excel'
              ? <span className="spinner-border spinner-border-sm"/>
              : <FiDownload size={14}/>}
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-sm-3">
              <label className="form-label fw-600" style={{fontSize:'0.82rem'}}>Year</label>
              <input type="number" className="form-control" min="2000" max="2099"
                value={year} onChange={e => setYear(parseInt(e.target.value))} />
            </div>
            <div className="col-6 col-sm-3">
              <label className="form-label fw-600" style={{fontSize:'0.82rem'}}>Month</label>
              <select className="form-select" value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="col-12 col-sm-3">
              <button className="btn btn-primary w-100 fw-700" style={{borderRadius:10}}
                onClick={fetchReport} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"/> : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total Income',   value: totalIncome,   color:'#2E7D32', bg:'#E8F5E9', icon: <FiTrendingUp/> },
          { label:'Total Expenses', value: totalExpenses, color:'#E53935', bg:'#FFEBEE', icon: <FiTrendingDown/> },
          { label:'Net Savings',    value: netSavings,    color: netSavings >= 0 ? '#1565C0' : '#E53935', bg:'#E3F2FD', icon: <FiDollarSign/> },
          { label:'Savings Rate',   value: null, display: `${savingsRate}%`, color: savingsRate >= 20 ? '#2E7D32' : '#FF6B00', bg:'#FFF3E0', icon: '🏦' },
        ].map(({ label, value, display, color, bg, icon }) => (
          <div key={label} className="col-6 col-sm-3">
            <div className="card h-100">
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <div style={{width:44,height:44,borderRadius:12,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',color,flexShrink:0}}>
                  {icon}
                </div>
                <div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
                  <div className="fw-800" style={{fontSize:'1.1rem',color}}>
                    {display || fmt(value)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        {/* Income vs Expense Bar Chart — from dashboard chart_data (yearly trend) */}
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header fw-700">Income vs Expense — Monthly Trend ({now.getFullYear()})</div>
            <div className="card-body p-3">
              <div className="chart-container">
                {summary.chart_data.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">No chart data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.chart_data} margin={{top:5,right:5,left:-20,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                      <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-muted)'}}/>
                      <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                      <Tooltip formatter={v=>[fmt(v),'']} contentStyle={{borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)'}}/>
                      <Legend/>
                      <Bar dataKey="income"  name="Income"  fill="#2E7D32" radius={[4,4,0,0]}/>
                      <Bar dataKey="expense" name="Expense" fill="#E53935" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-header fw-700">Expenses by Category</div>
            <div className="card-body p-3">
              <div className="chart-container">
                {catBreakdown.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">No expense data for this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catBreakdown}
                        cx="50%" cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {catBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v=>[fmt(v),'Amount']} contentStyle={{borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Trend Line */}
      {summary.chart_data.length > 0 && (
        <div className="card mb-4">
          <div className="card-header fw-700">Savings Trend</div>
          <div className="card-body p-3">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={summary.chart_data.map(d => ({
                    ...d,
                    savings: parseFloat(((d.income||0) - (d.expense||0)).toFixed(2)),
                  }))}
                  margin={{top:5,right:10,left:-20,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-muted)'}}/>
                  <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={v=>[fmt(v),'']} contentStyle={{borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)'}}/>
                  <Legend/>
                  <Line type="monotone" dataKey="income"  name="Income"  stroke="#2E7D32" strokeWidth={2} dot={{r:4}} activeDot={{r:6}}/>
                  <Line type="monotone" dataKey="expense" name="Expense" stroke="#E53935" strokeWidth={2} dot={{r:4}} activeDot={{r:6}}/>
                  <Line type="monotone" dataKey="savings" name="Net Savings" stroke="#1565C0" strokeWidth={2} strokeDasharray="5 5" dot={{r:3}} activeDot={{r:5}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span className="fw-700">Transaction Details</span>
          <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{transactions.length} records</span>
        </div>
        <div className="card-body p-0">
          {txLoading ? (
            <div className="text-center py-5"><div className="spinner-border text-warning"/></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-muted py-4">No transactions for selected period.</td></tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={`${t.type}-${t.id}`}>
                        <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{t.date}</td>
                        <td>
                          <span className={`badge ${t.type === 'Income' ? 'badge-income' : 'badge-expense'}`}
                            style={{fontSize:'0.72rem'}}>
                            {t.type === 'Income' ? '💰' : '💸'} {t.type}
                          </span>
                        </td>
                        <td className="fw-600" style={{fontSize:'0.88rem'}}>{t.title}</td>
                        <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{t.category}</td>
                        <td className="text-end fw-700"
                          style={{color: t.type === 'Income' ? '#2E7D32' : '#E53935'}}>
                          {t.type === 'Income' ? '+' : '-'}{fmt(Math.abs(t.amount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot style={{borderTop:'2px solid var(--border)'}}>
                    <tr>
                      <td colSpan={4} className="fw-700" style={{fontSize:'0.88rem',color:'var(--text-muted)'}}>Period Total</td>
                      <td className="text-end fw-800"
                        style={{color: netSavings >= 0 ? '#2E7D32' : '#E53935', fontSize:'0.95rem'}}>
                        {netSavings >= 0 ? '+' : ''}{fmt(netSavings)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
