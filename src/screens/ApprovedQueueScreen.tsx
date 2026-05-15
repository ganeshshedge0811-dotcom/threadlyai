import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Send, Clock, AlertTriangle, Copy, X, Calendar, RefreshCw } from 'lucide-react';

const ApprovedQueueScreen: React.FC = () => {
  const { approvedReplies, postReply, retryWithBackup, postManually, creditWallets, scheduleReply } = useAppContext();
  const [scheduleModalId, setScheduleModalId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [visibleScheduleId, setVisibleScheduleId] = useState<string | null>(null);

  const handleSchedule = async () => {
    if (!scheduleModalId || !scheduleDate || !scheduleTime) return;
    const scheduledTime = `${scheduleDate}T${scheduleTime}`;
    setLoadingId(scheduleModalId);
    await scheduleReply(scheduleModalId, scheduledTime);
    setLoadingId(null);
    setScheduleModalId(null);
    setScheduleDate('');
    setScheduleTime('');
  };

  const handleAction = async (action: () => Promise<void>, id: string) => {
    setLoadingId(id);
    await action();
    setLoadingId(null);
  };

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Approved Queue</h2>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {approvedReplies.filter(r => r.status === 'Pending').length} pending · {approvedReplies.filter(r => r.status === 'Scheduled').length} scheduled · {approvedReplies.filter(r => r.status === 'Posted').length} posted
          </p>
        </div>
      </div>

      {/* Schedule Modal */}
      {scheduleModalId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '100%',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
          }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h3 className="flex items-center gap-2" style={{ margin: 0, fontSize: '1.1rem' }}>
                <Calendar size={18} className="text-green" /> Schedule Post
              </h3>
              <button onClick={() => setScheduleModalId(null)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex'
              }}>
                <X size={18} />
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                min={getMinDate()}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setScheduleModalId(null)} className="btn btn-outline" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="btn btn-primary"
                disabled={!scheduleDate || !scheduleTime || loadingId === scheduleModalId}
                style={{ flex: 1, opacity: (!scheduleDate || !scheduleTime || loadingId === scheduleModalId) ? 0.5 : 1 }}
              >
                {loadingId === scheduleModalId ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Clock size={16} />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {approvedReplies.length === 0 ? (
        <div className="card hover-pop" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>No pending replies</h3>
          <p style={{ marginTop: '0.5rem' }}>Approve threads from your inbox to see them here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {approvedReplies.map(reply => {
            const platformKey = reply.platform.toLowerCase() as keyof typeof creditWallets;
            const isLimitReached = creditWallets[platformKey] < 15;
            const platformColor = reply.platform === 'Reddit' ? '#ff4500' : reply.platform === 'Twitter' ? '#1da1f2' : reply.platform === 'LinkedIn' ? '#0077b5' : '#ff6600';
            
            return (
            <div key={reply.id} className="card hover-pop" style={{ borderLeft: `3px solid ${platformColor}` }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: platformColor, backgroundColor: `${platformColor}18`,
                      padding: '0.15rem 0.5rem', borderRadius: '4px'
                    }}>{reply.platform}</span>
                    <span className={`badge ${
                      reply.status === 'Pending' ? 'badge-medium' : 
                      reply.status === 'Posted' ? 'badge-high' : 
                      reply.status === 'Failed' ? 'badge-low' :
                      'badge-medium'
                    }`} 
                    onClick={reply.status === 'Scheduled' && reply.scheduledTime ? () => setVisibleScheduleId(visibleScheduleId === reply.id ? null : reply.id) : undefined}
                    style={{
                      ...(reply.status === 'Scheduled' ? { 
                        background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)',
                        cursor: 'pointer', userSelect: 'none'
                      } : {})
                    }}>
                      {reply.status === 'Scheduled' && <Clock size={11} style={{ marginRight: '3px' }} />}
                      {reply.status}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{reply.source}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{reply.title}</h3>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '3px solid var(--primary-green)' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{reply.replyText}</p>
              </div>

              {reply.status === 'Scheduled' && reply.scheduledTime && visibleScheduleId === reply.id && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.8rem', color: '#818cf8', marginBottom: '1rem',
                  padding: '0.6rem 0.875rem', 
                  backgroundColor: 'rgba(99, 102, 241, 0.08)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <Calendar size={14} />
                  <span><strong>Scheduled for:</strong> {new Date(reply.scheduledTime).toLocaleString([], { 
                    weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}</span>
                </div>
              )}

              <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {reply.status === 'Posted' && <span className="flex items-center gap-1 text-green">✓ Posted to {reply.platform}</span>}
                  {reply.status === 'Pending' && 'Ready to be published.'}
                  {reply.status === 'Failed' && (
                    <span className="text-red flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Platform API blocked the request. Don't panic!
                    </span>
                  )}
                  {reply.status === 'Scheduled' && 'Will be posted automatically at the scheduled time.'}
                </div>
                
                {reply.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setScheduleModalId(reply.id)}
                      disabled={loadingId === reply.id}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', opacity: loadingId === reply.id ? 0.5 : 1 }}
                    >
                      <Clock size={15} />
                      Schedule
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleAction(() => postReply(reply.id), reply.id)}
                      disabled={isLimitReached || loadingId === reply.id}
                      style={{ opacity: (isLimitReached || loadingId === reply.id) ? 0.5 : 1, padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      {loadingId === reply.id ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                      Post Now (15 Cr)
                    </button>
                    {isLimitReached && (
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleAction(() => postManually(reply.id), reply.id)}
                        disabled={loadingId === reply.id}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', opacity: loadingId === reply.id ? 0.5 : 1 }}
                      >
                        <Copy size={15} />
                        Post Manually
                      </button>
                    )}
                  </div>
                )}

                {reply.status === 'Failed' && (
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleAction(() => postManually(reply.id), reply.id)}
                      disabled={loadingId === reply.id}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', opacity: loadingId === reply.id ? 0.5 : 1 }}
                    >
                      <Copy size={15} /> Copy & Post Manually
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleAction(() => retryWithBackup(reply.id), reply.id)}
                      disabled={loadingId === reply.id}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', opacity: loadingId === reply.id ? 0.5 : 1 }}
                    >
                      {loadingId === reply.id ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={15} />}
                      Retry via Backup
                    </button>
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ApprovedQueueScreen;
