import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, RefreshCw, Sparkles, Inbox, ExternalLink } from 'lucide-react';
import { generateReplyDraft } from '../lib/ai';
import RichTextEditor from '../components/RichTextEditor';

const PLATFORMS = ['All', 'Reddit', 'Twitter', 'LinkedIn', 'HackerNews'];
const PLATFORM_COLORS: Record<string, string> = { Reddit: '#ff4500', Twitter: '#1da1f2', LinkedIn: '#0077b5', HackerNews: '#ff6600' };
const PLATFORM_ICONS: Record<string, string> = { Reddit: '🟠', Twitter: '🐦', LinkedIn: '🔵', HackerNews: '🟡' };

const InboxScreen: React.FC = () => {
  const { threads, approveThread, rejectThread, refreshThreads, isScanning, settings } = useAppContext();
  const [activeFilter, setActiveFilter] = useState('All');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const filtered = activeFilter === 'All' ? threads : threads.filter(t => t.platform === activeFilter);
  const getDraft = (t: any) => drafts[t.id] ?? t.aiDraft;

  const handleAction = async (action: () => Promise<void>, id: string) => {
    setLoadingId(id); await action(); setLoadingId(null);
  };

  const handleGenerateAI = async (thread: any) => {
    setGeneratingId(thread.id); setExpandedId(thread.id);
    try {
      const d = await generateReplyDraft(thread.bodyPreview, thread.platform, settings);
      setDrafts(prev => ({ ...prev, [thread.id]: d }));
    } catch {
      setDrafts(prev => ({ ...prev, [thread.id]: `Great point! Would love to share what's worked for me.` }));
    } finally { setGeneratingId(null); }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))', borderRadius: '10px', padding: '8px', display: 'flex' }}>
            <Inbox size={18} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Inbox</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{threads.length} opportunit{threads.length !== 1 ? 'ies' : 'y'} detected</p>
          </div>
        </div>
        <button className="btn btn-primary hover-pop" onClick={refreshThreads} disabled={isScanning}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isScanning ? 0.7 : 1 }}>
          <RefreshCw size={15} style={{ animation: isScanning ? 'spin 1s linear infinite' : 'none' }} />
          {isScanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {PLATFORMS.map(p => {
          const count = p === 'All' ? threads.length : threads.filter(t => t.platform === p).length;
          const color = PLATFORM_COLORS[p] ?? 'var(--primary-indigo)';
          const active = activeFilter === p;
          return (
            <button key={p} onClick={() => setActiveFilter(p)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem',
              borderRadius: '50px', border: `1px solid ${active ? color : 'var(--border-color)'}`,
              cursor: 'pointer', fontFamily: 'var(--font-family)', fontSize: '0.8rem', fontWeight: 600,
              transition: 'all 0.2s', backgroundColor: active ? `${color}20` : 'rgba(255,255,255,0.03)',
              color: active ? color : 'var(--text-muted)', boxShadow: active ? `0 0 12px ${color}30` : 'none',
            }}>
              {PLATFORM_ICONS[p] ?? '🌐'} {p}
              {count > 0 && <span style={{ backgroundColor: active ? color : 'var(--border-color)', color: active ? '#fff' : 'var(--text-muted)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>All caught up!</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>No new threads. Thredly is monitoring in the background...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map(thread => {
            const isExpanded = expandedId === thread.id;
            const draft = getDraft(thread);
            const color = PLATFORM_COLORS[thread.platform] ?? 'var(--primary-indigo)';
            const isLoading = loadingId === thread.id;
            const isGenerating = generatingId === thread.id;

            return (
              <div key={thread.id} style={{
                background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)',
                borderLeft: `4px solid ${color}`, overflow: 'hidden', transition: 'box-shadow 0.2s',
                boxShadow: isExpanded ? `0 8px 30px rgba(0,0,0,0.25)` : 'none',
              }}>
                {/* Card Top */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, backgroundColor: `${color}18`, padding: '0.2rem 0.6rem', borderRadius: '6px', border: `1px solid ${color}30` }}>
                          {PLATFORM_ICONS[thread.platform]} {thread.platform}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{thread.source}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.6 }}>· {thread.timeAgo ?? '2h ago'}</span>
                        <span className={`badge ${thread.intent === 'High' ? 'badge-high' : thread.intent === 'Medium' ? 'badge-medium' : 'badge-low'}`}>{thread.intent} Intent</span>
                      </div>
                      <h3 style={{ fontSize: '0.97rem', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{thread.title}</h3>
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : thread.id)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontFamily: 'var(--font-family)' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {thread.snippet && (
                    <div style={{ marginTop: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: `2px solid ${color}40` }}>
                      "{thread.snippet}"
                    </div>
                  )}
                </div>

                {/* AI Draft */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-indigo)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Sparkles size={13} /> AI Draft Reply
                      </span>
                      <button onClick={() => handleGenerateAI(thread)} disabled={isGenerating} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--primary-indigo)', color: 'var(--primary-indigo)', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontFamily: 'var(--font-family)', padding: '4px 10px', opacity: isGenerating ? 0.5 : 1 }}>
                        {isGenerating ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />} Regenerate
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <RichTextEditor value={draft || ''} onChange={v => setDrafts(prev => ({ ...prev, [thread.id]: v }))} readOnly={false} disabled={isGenerating} />
                      {isGenerating && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--primary-indigo)', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: '8px', zIndex: 10, backdropFilter: 'blur(3px)' }}>
                          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontWeight: 600 }}>Generating...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {thread.upvotes && <span>↑ {thread.upvotes}</span>}
                    {thread.comments && <span>💬 {thread.comments}</span>}
                    {thread.url && <a href={thread.url} target="_blank" rel="noreferrer" style={{ color, display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}><ExternalLink size={12} /> View</a>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {!isExpanded && (
                      <button onClick={() => handleGenerateAI(thread)} disabled={isGenerating} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: `1px solid ${color}`, color, background: `${color}10`, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, opacity: isGenerating ? 0.5 : 1 }}>
                        <Sparkles size={13} /> AI Draft
                      </button>
                    )}
                    <button onClick={() => handleAction(() => rejectThread(thread.id), thread.id)} disabled={isLoading} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', background: 'rgba(244,63,94,0.08)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, opacity: isLoading ? 0.5 : 1 }}>
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => { const clean = draft ? draft.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : ''; handleAction(async () => { await approveThread(thread.id, clean || draft); }, thread.id); }} disabled={isLoading} style={{ padding: '0.45rem 1rem', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))', color: '#fff', border: 'none', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, opacity: isLoading ? 0.5 : 1, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                      {isLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />} Approve & Queue
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InboxScreen;
