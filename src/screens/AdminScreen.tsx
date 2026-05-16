import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Download, Users, MessageSquare, Star, Lock, Eye, EyeOff } from 'lucide-react';

const ADMIN_PASSWORD = 'threadlyai2024';

interface WaitlistEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  useCase: string;
  createdAt: string;
}

interface FeedbackEntry {
  id: string;
  rating: number;
  category: string;
  message: string;
  createdAt: string;
}

interface AdminData {
  waitlist: WaitlistEntry[];
  feedback: FeedbackEntry[];
}

const AdminScreen: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData>({ waitlist: [], feedback: [] });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Try again.');
      setPasswordInput('');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/admin/data', { headers: { 'Authorization': passwordInput } })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((d: AdminData) => { setData(d); setLoading(false); })
      .catch(err => { console.error('Failed to load admin data', err); setLoading(false); });
  }, [isAuthenticated]);

  const exportCSV = () => {
    if (!data.waitlist.length) return alert('No waitlist data to export');
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,First Name,Last Name,Email,Use Case\n";
    
    // Rows
    data.waitlist.forEach(row => {
      const date = new Date(row.createdAt).toLocaleDateString();
      // escape quotes and wrap in quotes to handle commas in useCase
      const safeUseCase = `"${row.useCase.replace(/"/g, '""')}"`;
      const rowStr = `${date},${row.firstName},${row.lastName},${row.email},${safeUseCase}`;
      csvContent += rowStr + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `waitlist_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Password gate
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-family)', padding: '2rem' }}>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Lock size={28} color="var(--danger-red)" />
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>Admin Access</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 2rem' }}>Enter the admin password to continue</p>
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                autoFocus
                style={{ width: '100%', padding: '0.875rem 3rem 0.875rem 1rem', borderRadius: '12px', background: '#1f2937', border: `1px solid ${authError ? 'var(--danger-red)' : '#374151'}`, color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'var(--font-family)', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {authError && <p style={{ color: 'var(--danger-red)', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'left' }}>⚠ {authError}</p>}
            <button type="submit" style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-family)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
              Unlock Dashboard
            </button>
          </form>
          <button onClick={() => navigate('/')} style={{ marginTop: '1.25rem', background: 'none', border: 'none', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>← Back to home</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading admin data...</div>;
  }

  const avgRating = data.feedback.length > 0 
    ? (data.feedback.reduce((sum, item) => sum + item.rating, 0) / data.feedback.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Top Header */}
      <div className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} className="header-icon-btn">
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color="var(--danger-red)" />
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card stat-card hover-lift">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <Users color="var(--primary-indigo)" size={24} />
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Signups</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{data.waitlist.length}</div>
          </div>
          
          <div className="card stat-card hover-lift">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <MessageSquare color="var(--primary-green)" size={24} />
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Feedback Entries</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{data.feedback.length}</div>
          </div>
          
          <div className="card stat-card hover-lift">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <Star color="#facc15" size={24} />
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Excitement</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{avgRating}</div>
          </div>
        </div>

        {/* Waitlist Table */}
        <div className="card" style={{ marginBottom: '2rem', padding: '0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Waitlist ({data.waitlist.length})</h2>
            <button onClick={exportCSV} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use Case</th>
                </tr>
              </thead>
              <tbody>
                {data.waitlist.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No signups yet.</td></tr>
                ) : (
                  data.waitlist.map((entry) => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{new Date(entry.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{entry.firstName} {entry.lastName}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--primary-indigo)' }}>{entry.email}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.useCase || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback List */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Feedback Received ({data.feedback.length})</h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {data.feedback.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No feedback yet.</div>
            ) : (
              data.feedback.map(entry => (
                <div key={entry.id} style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-highlight)' }}>{entry.category}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} size={14} fill={i < entry.rating ? "#facc15" : "transparent"} color={i < entry.rating ? "#facc15" : "var(--border-color)"} />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{entry.message || <em style={{color: 'var(--text-muted)'}}>No message provided</em>}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
