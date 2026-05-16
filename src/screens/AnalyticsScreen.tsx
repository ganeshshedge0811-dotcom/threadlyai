import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { BarChart2, MessageSquare, CheckCircle, TrendingUp, Shield, Zap, Target, ArrowUpRight, Loader } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
  Reddit: '#ff4500',
  Twitter: '#1da1f2',
  LinkedIn: '#0077b5',
  HackerNews: '#ff6600',
};

const CREDIT_LIMITS: Record<string, number> = {
  reddit: 150, twitter: 150, linkedin: 100, hackernews: 50,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Skeleton loader for cards ---
const SkeletonCard: React.FC = () => (
  <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ width: 48, height: 20, borderRadius: 50, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
    </div>
    <div style={{ width: '60%', height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
    <div style={{ width: '40%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
  </div>
);

// --- Stat card component ---
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

// --- Helper: compute trend % ---
function computeTrend(current: number, previous: number): string | undefined {
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return `+${current > 0 ? '100' : '0'}%`;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return undefined;
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

// --- Helper: get start of current/previous week ---
function getWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

  return { startOfWeek, startOfPrevWeek, now };
}

const AnalyticsScreen: React.FC = () => {
  const { threads, approvedReplies, creditWallets, notifications } = useAppContext();
  const { user } = useAuth();
  const [activePeriod, setActivePeriod] = useState('7D');
  const [loading, setLoading] = useState(true);

  // Historical data from Supabase
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [allReplies, setAllReplies] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchHistorical = async () => {
      setLoading(true);
      try {
        const [threadsRes, repliesRes] = await Promise.all([
          supabase.from('threads').select('id, platform, created_at').eq('user_id', user.id),
          supabase.from('approved_replies').select('id, platform, status, created_at').eq('user_id', user.id),
        ]);
        setAllThreads([
          ...(threadsRes.data || []),
          ...threads.filter(t => !t.id.startsWith('demo_')).map(t => ({ id: t.id, platform: t.platform, created_at: t.postedTime })),
        ]);
        setAllReplies(repliesRes.data || []);
      } catch {
        // Use context data as fallback
        setAllThreads(threads.map(t => ({ id: t.id, platform: t.platform, created_at: t.postedTime })));
        setAllReplies(approvedReplies.map(r => ({ id: r.id, platform: r.platform, status: r.status, created_at: new Date().toISOString() })));
      } finally {
        setLoading(false);
      }
    };
    fetchHistorical();
  }, [user]);

  // --- Deduplicate threads (DB + context may overlap) ---
  const uniqueThreads = useMemo(() => {
    const seen = new Set<string>();
    return allThreads.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  }, [allThreads]);

  // --- Period filtering ---
  const periodDays = activePeriod === '7D' ? 7 : activePeriod === '30D' ? 30 : 9999;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periodDays);
  const prevCutoff = new Date(); prevCutoff.setDate(prevCutoff.getDate() - periodDays * 2);

  const filteredThreads = uniqueThreads.filter(t => new Date(t.created_at) >= cutoff);
  const prevThreads = uniqueThreads.filter(t => { const d = new Date(t.created_at); return d >= prevCutoff && d < cutoff; });

  const filteredReplies = allReplies.filter(r => new Date(r.created_at) >= cutoff);
  const prevReplies = allReplies.filter(r => { const d = new Date(r.created_at); return d >= prevCutoff && d < cutoff; });

  // --- Stat card values ---
  const totalDetected = filteredThreads.length;
  const totalApproved = filteredReplies.length;
  const totalPosted = filteredReplies.filter(r => r.status === 'Posted').length;

  const totalCreditsUsed = Object.entries(CREDIT_LIMITS).reduce((sum, [key, limit]) => {
    return sum + (limit - (creditWallets[key as keyof typeof creditWallets] ?? limit));
  }, 0);

  const trendDetected = computeTrend(totalDetected, prevThreads.length);
  const trendApproved = computeTrend(totalApproved, prevReplies.length);
  const trendPosted = computeTrend(totalPosted, prevReplies.filter(r => r.status === 'Posted').length);

  // --- Weekly chart data ---
  const weeklyData = useMemo(() => {
    const { startOfWeek } = getWeekBounds();
    const days = DAY_NAMES.map((name, i) => {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dayThreads = uniqueThreads.filter(t => { const d = new Date(t.created_at); return d >= dayStart && d < dayEnd; }).length;
      const dayReplies = allReplies.filter(r => { const d = new Date(r.created_at); return d >= dayStart && d < dayEnd; }).length;

      return { day: name, Threads: dayThreads, Replies: dayReplies };
    });
    return days;
  }, [uniqueThreads, allReplies]);

  // --- Platform donut data ---
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredThreads.forEach(t => { counts[t.platform] = (counts[t.platform] || 0) + 1; });
    const entries = Object.entries(counts).map(([name, value]) => ({
      name, value, color: PLATFORM_COLORS[name] || '#888',
    }));
    // If no data, show placeholder
    if (entries.length === 0) {
      return [
        { name: 'Reddit', value: 0, color: '#ff4500' },
        { name: 'Twitter', value: 0, color: '#1da1f2' },
        { name: 'LinkedIn', value: 0, color: '#0077b5' },
        { name: 'HackerNews', value: 0, color: '#ff6600' },
      ];
    }
    return entries;
  }, [filteredThreads]);

  // --- Account health ---
  const accountHealth = useMemo(() => {
    const totalCredits = Object.values(CREDIT_LIMITS).reduce((a, b) => a + b, 0);
    const remaining = Object.entries(creditWallets).reduce((sum, [key, val]) => sum + Math.min(val, CREDIT_LIMITS[key] || 0), 0);
    const ratio = totalCredits > 0 ? remaining / totalCredits : 1;
    if (ratio > 0.5) return { label: 'Good', color: 'var(--primary-green)' };
    if (ratio > 0.2) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'Low', color: 'var(--danger-red)' };
  }, [creditWallets]);

  // --- Last post time ---
  const lastPostTime = useMemo(() => {
    const posted = allReplies.filter(r => r.status === 'Posted');
    if (posted.length === 0) return '—';
    const sorted = posted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return new Date(sorted[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [allReplies]);

  // --- Activity log from real notifications ---
  const activityLog = useMemo(() => {
    if (notifications.length > 0) {
      return notifications.slice(0, 5).map(n => ({
        text: n.text,
        platform: n.platform || '',
        time: n.time,
        color: n.color || '',
        type: n.type,
      }));
    }
    // Fallback: derive from recent replies
    return allReplies.slice(0, 5).map(r => ({
      text: r.status === 'Posted' ? 'Posted reply on' : 'Approved reply for',
      platform: r.platform,
      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: PLATFORM_COLORS[r.platform] || '#888',
      type: r.status === 'Posted' ? 'success' as const : 'info' as const,
    }));
  }, [notifications, allReplies]);

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

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-indigo)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Loading analytics...</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

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
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time organic acquisition metrics</p>
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
        <StatCard title="Threads Detected" value={totalDetected} icon={<MessageSquare size={16} />} trend={trendDetected} color="#3b82f6" />
        <StatCard title="Replies Approved" value={totalApproved} icon={<CheckCircle size={16} />} trend={trendApproved} color="var(--primary-indigo)" />
        <StatCard title="Replies Posted" value={totalPosted} icon={<TrendingUp size={16} />} trend={trendPosted} color="var(--primary-purple)" />
        <StatCard title="Credits Used" value={totalCreditsUsed} icon={<Shield size={16} />} color="var(--primary-green)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0' }}>
            <Zap size={16} color="var(--primary-indigo)" /> Engagement Funnel (This Week)
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
                <YAxis stroke="var(--border-color)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
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
            {platformData.every(p => p.value === 0) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No thread data yet
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                    {platformData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }} itemStyle={{ color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Credit Usage + Account Health */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={16} color="#3b82f6" /> Credit Wallets
          </h3>

          {/* Account health + last post */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Account Health</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: accountHealth.color, display: 'inline-block', boxShadow: `0 0 6px ${accountHealth.color}` }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: accountHealth.color }}>{accountHealth.label}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Last Post</div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{lastPostTime}</span>
            </div>
          </div>

          {/* Per-platform credit bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(CREDIT_LIMITS).map(([key, limit]) => {
              const remaining = creditWallets[key as keyof typeof creditWallets] ?? limit;
              const pct = limit > 0 ? (remaining / limit) * 100 : 0;
              const platformName = key.charAt(0).toUpperCase() + key.slice(1);
              const color = PLATFORM_COLORS[platformName] || PLATFORM_COLORS[key === 'hackernews' ? 'HackerNews' : platformName] || '#888';
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{ color, fontWeight: 600 }}>{platformName === 'Hackernews' ? 'HackerNews' : platformName}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{remaining}/{limit}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '50px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '50px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 1.25rem 0' }}>System Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityLog.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No activity yet</div>
            ) : (
              activityLog.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: item.type === 'rejected' ? 'var(--danger-red)' : item.type === 'info' ? '#3b82f6' : 'var(--primary-green)', boxShadow: `0 0 6px ${item.type === 'rejected' ? 'var(--danger-red)' : item.type === 'info' ? '#3b82f6' : 'var(--primary-green)'}` }} />
                  <p style={{ fontSize: '0.8rem', margin: 0, flex: 1, color: 'var(--text-main)' }}>
                    {item.text} {item.platform && <strong style={{ color: item.color || 'var(--text-highlight)' }}>{item.platform}</strong>}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '50px' }}>{item.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
