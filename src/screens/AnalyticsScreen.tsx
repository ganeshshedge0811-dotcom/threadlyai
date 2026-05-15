import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart2, MessageSquare, CheckCircle, TrendingUp, Shield, Zap, Target, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend?: string; color?: string }> = ({ title, value, icon, trend, color = 'var(--primary-indigo)' }) => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem',
    border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.2)`; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
  >
    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: color, filter: 'blur(40px)', opacity: 0.15 }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ background: `${color}20`, padding: '8px', borderRadius: '10px', display: 'flex', color }}>{icon}</div>
      {trend && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--primary-green)', fontWeight: 700, background: 'rgba(0,210,106,0.1)', padding: '3px 8px', borderRadius: '50px' }}>
          <ArrowUpRight size={12} /> {trend}
        </span>
      )}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{title}</div>
  </div>
);

const AnalyticsScreen: React.FC = () => {
  const { threads, approvedReplies, karma, creditWallets } = useAppContext();
  const [activePeriod, setActivePeriod] = useState('7D');

  const totalDetected = threads.length + approvedReplies.length + 42;
  const totalApproved = approvedReplies.length + 15;
  const totalPosted = approvedReplies.filter(r => r.status === 'Posted').length + 12;
  const totalCreditsUsed = (150 - creditWallets.reddit) + (150 - creditWallets.twitter) + (100 - creditWallets.linkedin) + (50 - creditWallets.hackernews);

  const weeklyData = [
    { day: 'Mon', Threads: 45, Replies: 24 },
    { day: 'Tue', Threads: 52, Replies: 30 },
    { day: 'Wed', Threads: 38, Replies: 18 },
    { day: 'Thu', Threads: 65, Replies: 45 },
    { day: 'Fri', Threads: 48, Replies: 38 },
    { day: 'Sat', Threads: 25, Replies: 10 },
    { day: 'Sun', Threads: 35, Replies: 20 },
  ];

  const platformData = [
    { name: 'Reddit', value: 60, color: '#ff4500' },
    { name: 'Twitter', value: 25, color: '#1da1f2' },
    { name: 'LinkedIn', value: 15, color: '#0077b5' },
    { name: 'HackerNews', value: 5, color: '#ff6600' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '10px 15px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 700 }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const activityLog = [
    { text: 'Auto-replied to high-intent thread on', platform: 'Twitter', time: '12m ago', color: '#1da1f2', type: 'success' },
    { text: 'AI drafted a new response for', platform: 'LinkedIn', time: '45m ago', color: '#0077b5', type: 'info' },
    { text: 'Discovered trending conversation on', platform: 'Reddit', time: '2h ago', color: '#ff4500', type: 'new' },
    { text: 'Rate limit backed off for', platform: 'HackerNews', time: '4h ago', color: '#ff6600', type: 'warning' },
    { text: 'Rejected out-of-scope thread', platform: '', time: '6h ago', color: '', type: 'rejected' },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, var(--primary-indigo))', borderRadius: '10px', padding: '8px', display: 'flex' }}>
            <BarChart2 size={18} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Analytics</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Advanced organic acquisition metrics</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-card)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)' }}>
          {['7D', '30D', 'All'].map(period => (
            <button key={period} onClick={() => setActivePeriod(period)} style={{ padding: '0.35rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family)', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', background: activePeriod === period ? 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))' : 'transparent', color: activePeriod === period ? '#fff' : 'var(--text-muted)' }}>
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard title="Threads Detected" value={totalDetected} icon={<MessageSquare size={16} />} trend="+12%" color="#3b82f6" />
        <StatCard title="Replies Approved" value={totalApproved} icon={<CheckCircle size={16} />} trend="+8%" color="var(--primary-indigo)" />
        <StatCard title="Replies Posted" value={totalPosted} icon={<TrendingUp size={16} />} trend="+15%" color="var(--primary-purple)" />
        <StatCard title="Account Karma" value={karma.toLocaleString()} icon={<Shield size={16} />} trend="+3%" color="var(--primary-green)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0' }}>
            <Zap size={16} color="var(--primary-indigo)" /> Engagement Funnel (Weekly)
          </h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThreads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary-green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--border-color)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--border-color)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Threads" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorThreads)" />
                <Area type="monotone" dataKey="Replies" stroke="var(--primary-green)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReplies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={16} color="var(--primary-purple)" /> Traffic Sources
          </h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                  {platformData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }} itemStyle={{ color: 'var(--text-main)', fontSize: '0.85rem' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Credit Usage */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={16} color="#3b82f6" /> Credit Consumption
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-green)', lineHeight: 1 }}>{totalCreditsUsed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>credits used this cycle</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {platformData.map(p => (
              <div key={p.name} style={{ flex: 1, textAlign: 'center', padding: '0.65rem 0.25rem', backgroundColor: `${p.color}15`, borderRadius: '10px', border: `1px solid ${p.color}30` }}>
                <div style={{ fontSize: '0.6rem', color: p.color, fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase' }}>{p.name.slice(0, 2)}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {p.name === 'Reddit' ? 150 - creditWallets.reddit : p.name === 'Twitter' ? 150 - creditWallets.twitter : p.name === 'LinkedIn' ? 100 - creditWallets.linkedin : 50 - creditWallets.hackernews}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 1.25rem 0' }}>System Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityLog.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: item.type === 'rejected' ? 'var(--danger-red)' : item.type === 'warning' ? '#f59e0b' : item.type === 'info' ? '#3b82f6' : 'var(--primary-green)', boxShadow: `0 0 6px ${item.type === 'rejected' ? 'var(--danger-red)' : item.type === 'warning' ? '#f59e0b' : item.type === 'info' ? '#3b82f6' : 'var(--primary-green)'}` }} />
                <p style={{ fontSize: '0.8rem', margin: 0, flex: 1, color: 'var(--text-main)' }}>
                  {item.text} {item.platform && <strong style={{ color: item.color }}>{item.platform}</strong>}
                </p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '50px' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
