import React, { useState, useEffect } from 'react';
import { FiCpu, FiRefreshCw, FiTrendingUp, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const AIAdvice = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAdvice(); }, []);

  const fetchAdvice = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ai/advice/');
      setAiData(res.data);
    } catch(err){
      setError('Unable to load AI advice at this time. Please check your connection.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const tipColors = { 
    critical: { bg:'#FFEBEE',color:'#E53935',border:'rgba(229,57,53,0.2)' }, 
    danger:   { bg:'#FFEBEE',color:'#E53935',border:'rgba(229,57,53,0.2)' }, 
    warning:  { bg:'#FFF8E1',color:'#F57C00',border:'rgba(255,107,0,0.2)' }, 
    success:  { bg:'#E8F5E9',color:'#2E7D32',border:'rgba(46,125,50,0.2)' }, 
    info:     { bg:'#E3F2FD',color:'#1565C0',border:'rgba(21,101,192,0.2)' } 
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center gap-2"><FiCpu/> AI Budget Advisor</h1>
          <p className="page-subtitle">Personalized financial insights powered by AI</p>
        </div>
        <button className="btn btn-outline-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:10}} onClick={()=>fetchAdvice(true)} disabled={refreshing}>
          <FiRefreshCw size={14} className={refreshing?'animate-spin':''}/> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning mb-3"/>
          <p className="text-muted">Analyzing your financial data...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger rounded-xl">{error}</div>
      ) : aiData && (
        <>
          {/* Main AI advice card */}
          <div className="card mb-4" style={{background:'linear-gradient(135deg,#FFF8F0,#FFFDE7)',borderColor:'rgba(255,107,0,0.2)'}}>
            <div className="card-body p-4">
              <div className="d-flex align-items-start gap-3">
                <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#FF6B00,#FF8C3A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',flexShrink:0,boxShadow:'0 4px 16px rgba(255,107,0,0.3)',color:'white'}}>{aiData.score >= 80 ? '🌟' : aiData.score >= 50 ? '🤖' : '⚠️'}</div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-800" style={{color:'var(--primary)',fontSize:'0.9rem',textTransform:'uppercase',letterSpacing:'0.5px'}}>{aiData.summary}</div>
                    <div className="fw-800" style={{fontSize:'1.2rem', color: aiData.score >= 80 ? '#2E7D32' : aiData.score >= 50 ? '#F57C00' : '#E53935'}}>
                      Score: {aiData.score}/100
                    </div>
                  </div>
                  <p style={{color:'var(--text)',lineHeight:1.8,margin:0,fontSize:'0.95rem'}}>
                    Based on your spending patterns this month, your financial health is <strong>{aiData.status}</strong>. 
                    {aiData.metrics.savings > 0 
                      ? ` You are successfully saving money this month.` 
                      : ` You are spending more than you are earning.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial snapshot */}
          <div className="row g-3 mb-4">
            {[
              { label:'Monthly Income', value:aiData.metrics.total_income, color:'#2E7D32', emoji:'💰' },
              { label:'Monthly Expenses', value:aiData.metrics.total_spent, color:'#E53935', emoji:'💸' },
              { label:'Net Savings', value:aiData.metrics.savings, color: aiData.metrics.savings>=0?'#1565C0':'#E53935', emoji:'🏦' },
            ].map(({label,value,color,emoji})=>(
              <div key={label} className="col-12 col-sm-4">
                <div className="card">
                  <div className="card-body p-3 d-flex align-items-center gap-3">
                    <div style={{fontSize:'1.6rem'}}>{emoji}</div>
                    <div>
                      <div style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>{label}</div>
                      <div className="fw-800" style={{fontSize:'1.1rem',color}}>₹{Number(value||0).toLocaleString('en-IN', {maximumFractionDigits:0})}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="card">
            <div className="card-header fw-700 d-flex align-items-center gap-2"><FiTrendingUp style={{color:'var(--primary)'}}/> Personalized AI Insights</div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {aiData.advice.length === 0 ? (
                  <div className="text-center text-muted py-3">Not enough data to generate specific insights yet. Keep tracking!</div>
                ) : (
                  aiData.advice.map((tip, i) => {
                    const s = tipColors[tip.type] || tipColors.info;
                    return (
                      <div key={i} className="d-flex align-items-start gap-3 p-3 rounded-xl" style={{background:s.bg,border:`1px solid ${s.border}`}}>
                        <span style={{fontSize:'1.5rem',flexShrink:0}}>{tip.icon}</span>
                        <div>
                          <div className="fw-800 mb-1" style={{color:s.color, fontSize:'0.9rem'}}>{tip.title}</div>
                          <p className="mb-0" style={{color:s.color,fontWeight:600,fontSize:'0.85rem',lineHeight:1.6, opacity: 0.9}}>{tip.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAdvice;
