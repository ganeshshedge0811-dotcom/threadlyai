import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, MessageSquare, CheckCircle, Shield, BarChart2, 
  Zap, ArrowRight, Star, Bell, Lock, Info, X
} from 'lucide-react';
import LightningCursor from '../components/LightningCursor';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Waitlist / Feedback state

  const [fEmail, setFEmail] = useState('');
  const [fRating, setFRating] = useState(0);
  const [fHoverRating, setFHoverRating] = useState(0);
  const [fCategory, setFCategory] = useState('Feature request');
  const [fMessage, setFMessage] = useState('');
  const [fStatus, setFStatus] = useState<'idle'|'submitting'|'success'>('idle');

  // Info Modal State
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Live stats from backend
  const [liveStats, setLiveStats] = useState({ signups: 0, feedback: 0 });
  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/admin/data')
        .then(r => r.json())
        .then(d => setLiveStats({ signups: d.waitlist?.length ?? 0, feedback: d.feedback?.length ?? 0 }))
        .catch(() => {}); // silent fail
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const emailInputRef = React.useRef<HTMLInputElement>(null);

  const scrollToEmailInput = () => {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // After scroll completes, focus the email field
      setTimeout(() => emailInputRef.current?.focus(), 600);
    }
  };



  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fMessage.trim()) return alert('Please enter a message');
    
    setFStatus('submitting');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: fRating, category: fCategory, message: fMessage })
      });
      if (fEmail) {
        await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: 'FeedbackUser', email: fEmail })
        });
        setLiveStats(s => ({ ...s, signups: s.signups + 1 }));
      }
      setFStatus('success');
      setLiveStats(s => ({ ...s, feedback: s.feedback + 1 }));
    } catch (e) {
      console.error(e);
      setFStatus('idle');
    }
  };

  const features = [
    { icon: <Search size={24} />, title: '24/7 Platform Monitoring', desc: 'ThreadlyAI scans Reddit, Twitter, LinkedIn & HackerNews around the clock for high-intent conversations matching your keywords.' },
    { icon: <Zap size={24} />, title: 'AI-Drafted Replies', desc: 'Claude AI crafts a genuine, helpful response that provides 90% value and subtly positions your product — never sounding like an ad.' },
    { icon: <CheckCircle size={24} />, title: 'Human Approval Required', desc: 'Nothing ever posts automatically. Every AI draft waits in your inbox for your personal review and one-click approval.' },
    { icon: <Shield size={24} />, title: 'Built-In Ban Protection', desc: 'Platform-specific credit wallets enforce natural posting rates. Automated account rotation kicks in if a primary account is flagged.' },
    { icon: <BarChart2 size={24} />, title: 'Cross-Platform Analytics', desc: 'See exactly which platforms and keywords are driving the most leads so you can double down on what works.' },
    { icon: <MessageSquare size={24} />, title: 'BYOK — Your Own Accounts', desc: 'Connect your own Reddit & Twitter accounts. Your data, your accounts, full control. We never hold or own your credentials.' },
  ];

  const steps = [
    { n: '01', title: 'Connect & Configure', desc: 'Tell ThreadlyAI your product name, target audience, competitor keywords, and which platforms to monitor.' },
    { n: '02', title: 'ThreadlyAI Finds Leads', desc: 'Our AI scans thousands of posts daily. Only high-intent threads where users are actively looking for solutions like yours get surfaced.' },
    { n: '03', title: 'Review AI Drafts', desc: 'Each thread comes with a ready-to-go AI reply in your inbox. Edit it to sound exactly like you, then approve.' },
    { n: '04', title: 'Post & Track Growth', desc: 'Your approved reply goes live via your account. Watch your analytics as leads start converting into customers.' },
  ];

  const handleNavigate = (path: string) => {
    const dest = (user && (path === '/auth' || path === '/')) ? '/dashboard/inbox' : path;
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(dest));
    } else {
      navigate(dest);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', fontFamily: 'var(--font-family)', position: 'relative' }}>
      <LightningCursor />

      {/* 🔔 Top Announcement Banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #a855f7, #6366f1)',
        backgroundSize: '300% 100%',
        animation: 'gradientShift 6s ease infinite',
        padding: '0.55rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
        fontSize: '0.82rem', color: '#fff', fontWeight: 500,
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          🚀 <span>We're launching soon — join the waitlist for <strong>early access & exclusive pricing!</strong></span>
        </span>
        <button
          onClick={scrollToEmailInput}
          style={{
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', padding: '0.3rem 1rem', borderRadius: '50px',
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
            backdropFilter: 'blur(4px)', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontFamily: 'var(--font-family)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        >
          <Bell size={13} fill="#fff" /> Notify Me
        </button>
      </div>

      {/* Navbar — sits below announcement banner */}
      <nav style={{ 
        position: 'fixed', top: '36px', left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(12px)', 
        backgroundColor: 'rgba(10,12,16,0.85)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div className="hover-lift" onClick={() => handleNavigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Shield size={22} color="var(--primary-green)" />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>ThreadlyAI</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#features" className="landing-nav-link" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Features</a>
          <a href="#how-it-works" className="landing-nav-link" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>How It Works</a>
          <a href="#pricing" className="landing-nav-link" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Waitlist</a>
          <a href="#faq" className="landing-nav-link" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>FAQ</a>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <button onClick={() => handleNavigate('/dashboard/inbox')} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button onClick={() => handleNavigate('/auth')} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem' }}>Log In</button>
              <button onClick={() => window.location.hash = '#pricing'} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Start Free →</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mesh-bg" style={{ 
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '8rem 2rem 4rem', position: 'relative', overflow: 'hidden'
      }}>
        <div className="bg-marquee-container">
          <div className="bg-marquee-text">
            FIND CUSTOMERS ON AUTOPILOT • NEVER MISS A CONVERSATION • GROW ORGANICALLY • FIND CUSTOMERS ON AUTOPILOT • NEVER MISS A CONVERSATION • GROW ORGANICALLY •
          </div>
        </div>
        
        <div style={{ maxWidth: '800px', zIndex: 1, position: 'relative' }}>
          <div className="hover-lift glass-card" style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            borderRadius: '50px', padding: '0.35rem 1rem', marginBottom: '2rem',
            fontSize: '0.8rem', color: 'var(--text-highlight)', fontWeight: 600
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-indigo)', display: 'inline-block', animation: 'pulse 2s infinite', boxShadow: '0 0 10px var(--primary-indigo)' }} />
            AI-Powered Organic Acquisition
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1,
            marginBottom: '1.5rem', letterSpacing: '-0.03em'
          }}>
            Get Customers From<br />
            <span className="text-gradient">Real Conversations</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            ThreadlyAI monitors Reddit, Twitter, LinkedIn & HackerNews 24/7 for people asking about your exact pain points. AI drafts the reply. You approve it. Then it posts.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => window.location.hash = '#pricing'} className="btn btn-primary cta-glow" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              Start For Free <ArrowRight size={18} />
            </button>
            <button onClick={() => setShowInfoModal(true)} className="btn btn-outline hover-lift" style={{ fontSize: '1rem', padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={18} /> How it works & Credits
            </button>
            <button onClick={() => handleNavigate('/auth')} className="btn btn-outline hover-lift" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              Try Demo
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" style={{ padding: '6rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem' }}>How ThreadlyAI Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>From setup to your first customer in 4 simple steps.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          {steps.map((step) => (
            <div key={step.n} className="step-card glass-card hover-lift" style={{ 
              borderRadius: '16px', padding: '2rem', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ 
                fontSize: '3rem', fontWeight: 800, color: 'rgba(99, 102, 241, 0.15)',
                position: 'absolute', top: '1rem', right: '1rem', lineHeight: 1
              }}>{step.n}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-indigo)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {step.n}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>{step.title}</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem' }}>Everything You Need</h2>
            <p>The complete toolkit to turn online conversations into paying customers.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {features.map((f) => (
              <div key={f.title} className="feature-card glass-card hover-lift" style={{ 
                borderRadius: '16px', padding: '1.75rem',
              }}>
                <div style={{ color: 'var(--primary-indigo)', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLORFUL WAITLIST/FEEDBACK SECTION */}
      <section id="pricing" className="mesh-bg" style={{ padding: '8rem 2rem', position: 'relative' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          
          <div className="hover-lift" style={{ 
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))', 
            color: '#fbcfe8', padding: '6px 16px', borderRadius: '999px',
            fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem',
            border: '1px solid rgba(236, 72, 153, 0.4)', boxShadow: '0 0 15px rgba(236, 72, 153, 0.2)'
          }}>
            <Zap size={14} fill="#fbcfe8" /> Launching Soon
          </div>
          
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '1rem', textAlign: 'center', lineHeight: 1.1 }}>
            Something <span style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Great</span> Is On Its Way
          </h2>
          
          <p style={{ color: '#cbd5e1', fontSize: '1.15rem', textAlign: 'center', marginBottom: '1.5rem', maxWidth: '500px', lineHeight: 1.6 }}>
            Be the first to know when we launch — and get early access to exclusive pricing before it goes public.
          </p>

          {/* Live Stats Strip */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '50px', padding: '0.4rem 1.1rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', display: 'inline-block', boxShadow: '0 0 8px #a855f7', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e9d5ff' }}>{liveStats.signups > 0 ? liveStats.signups.toLocaleString() : '—'}</span>
              <span style={{ fontSize: '0.8rem', color: '#c4b5fd' }}>people on waitlist</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '50px', padding: '0.4rem 1.1rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899', display: 'inline-block', boxShadow: '0 0 8px #ec4899', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fce7f3' }}>{liveStats.feedback > 0 ? liveStats.feedback.toLocaleString() : '—'}</span>
              <span style={{ fontSize: '0.8rem', color: '#f9a8d4' }}>feedback shared</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '5rem' }}>
            <button 
              onClick={scrollToEmailInput}
              className="hover-pop"
              style={{ 
                background: 'linear-gradient(to right, #a855f7, #ec4899)', border: 'none', color: '#fff',
                padding: '0.85rem 2.5rem', borderRadius: '50px', fontSize: '1.05rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700,
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)', cursor: 'pointer'
              }}>
              <Bell size={18} fill="#fff" /> Notify Me When It Launches
            </button>
          </div>

          {/* Share your thoughts Dark Card */}
          <div className="hover-glow" style={{ 
            borderRadius: '24px', padding: '3rem', width: '100%',
            background: '#111827', border: '1px solid #1f2937',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Background Glow inside card */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#ec4899', filter: 'blur(80px)', opacity: 0.15, zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: '#a855f7', filter: 'blur(80px)', opacity: 0.15, zIndex: 0 }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f3f4f6' }}>
                <MessageSquare size={22} color="#ec4899" /> Share Your Thoughts
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
                Your feedback directly shapes what we build. Tell us what matters most to you.
              </p>

              {fStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <CheckCircle size={48} color="var(--primary-green)" style={{ margin: '0 auto 1rem' }} />
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6' }}>Thank You!</h4>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 500 }}>
                      Your email <span style={{color: '#6b7280', fontWeight: 400}}>(optional — if you'd like a reply)</span>
                    </label>
                    <input 
                      ref={emailInputRef}
                      type="email" 
                      value={fEmail}
                      onChange={(e) => setFEmail(e.target.value)}
                      placeholder="your@startup.com"
                      style={{ 
                        width: '100%', padding: '0.85rem 1rem', borderRadius: '8px',
                        background: '#1f2937', border: '1px solid #374151', color: '#fff',
                        transition: 'border-color 0.2s', outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                      onBlur={(e) => e.target.style.borderColor = '#374151'}
                    />
                  </div>

                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 500 }}>
                      How excited are you about this product?
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={28} 
                          fill={(fHoverRating || fRating) >= star ? "#ec4899" : "transparent"} 
                          color={(fHoverRating || fRating) >= star ? "#ec4899" : "#4b5563"}
                          style={{ 
                            cursor: 'pointer', transition: 'all 0.2s',
                            filter: (fHoverRating || fRating) >= star ? 'drop-shadow(0 0 8px rgba(236,72,153,0.5))' : 'none',
                            transform: fHoverRating === star ? 'scale(1.15)' : 'scale(1)'
                          }}
                          onMouseEnter={() => setFHoverRating(star)}
                          onMouseLeave={() => setFHoverRating(0)}
                          onClick={() => setFRating(star)}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 500 }}>
                      Type of feedback
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {['Feature request', 'Pricing concerns', 'Use case', 'General'].map(type => (
                        <button 
                          key={type}
                          type="button"
                          className="hover-lift"
                          onClick={() => setFCategory(type)}
                          style={{ 
                            background: fCategory === type ? 'transparent' : '#1f2937',
                            border: `1px solid ${fCategory === type ? '#ec4899' : '#374151'}`,
                            color: fCategory === type ? '#ec4899' : '#9ca3af', 
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
                            boxShadow: fCategory === type ? '0 0 10px rgba(236,72,153,0.1) inset' : 'none'
                          }}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 500 }}>
                      Your message <span style={{color: '#ef4444'}}>*</span>
                    </label>
                    <textarea 
                      required
                      value={fMessage}
                      onChange={(e) => setFMessage(e.target.value)}
                      placeholder="What would make this product a must-have for you? What's missing? What excites you most?"
                      rows={4}
                      style={{ 
                        width: '100%', padding: '0.85rem 1rem', borderRadius: '8px',
                        background: '#1f2937', border: '1px solid #374151', color: '#fff',
                        resize: 'vertical', transition: 'border-color 0.2s', outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                      onBlur={(e) => e.target.style.borderColor = '#374151'}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={fStatus === 'submitting'}
                    className="hover-lift"
                    style={{ 
                      width: '100%', background: 'linear-gradient(to right, #a855f7, #ec4899)',
                      color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '8px', fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer',
                      fontWeight: 600, boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
                    }}>
                    <MessageSquare size={18} /> {fStatus === 'submitting' ? 'Sending...' : 'Send Feedback'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <button 
            onClick={() => handleNavigate('/admin')}
            className="hover-lift"
            style={{ 
              marginTop: '3rem', background: '#1f2937', border: '1px solid #374151', color: '#9ca3af',
              padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
            }}>
            <Lock size={14} /> View signups (Admin)
          </button>

        </div>
      </section>

      {/* Info Modal Overlay */}
      {showInfoModal && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '1rem'
        }}>
          <div className="glass-card" style={{ 
            background: '#111827', border: '1px solid #1f2937', borderRadius: '24px', 
            width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
            padding: '2.5rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setShowInfoModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#1f2937', border: 'none', color: '#9ca3af', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f3f4f6' }}>
              ThreadlyAI <span style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Overview</span>
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '1.05rem' }}>Everything you need to know about how ThreadlyAI works and our credit system.</p>
            
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="#ec4899" /> How It Works
              </h3>
              <div style={{ background: '#1f2937', borderRadius: '12px', padding: '1.5rem' }}>
                <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#d1d5db', lineHeight: 1.7 }}>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Configure:</strong> Tell ThreadlyAI your product, audience, and keywords.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Scan:</strong> ThreadlyAI monitors Reddit, Twitter, LinkedIn 24/7 for high-intent discussions.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>AI Drafts:</strong> Claude AI automatically drafts natural, helpful replies mentioning your product.</li>
                  <li><strong>Approve & Post:</strong> You review the draft in your Inbox, click Approve, and it posts instantly via your own connected account.</li>
                </ol>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={20} color="#facc15" /> Key Features
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#1f2937', borderRadius: '12px', padding: '1rem' }}>
                  <strong style={{ color: '#f3f4f6', display: 'block', marginBottom: '0.25rem' }}>BYOK Accounts</strong>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Connect your own Reddit/Twitter accounts. Full control over your identity.</span>
                </div>
                <div style={{ background: '#1f2937', borderRadius: '12px', padding: '1rem' }}>
                  <strong style={{ color: '#f3f4f6', display: 'block', marginBottom: '0.25rem' }}>Ban Protection</strong>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Platform-specific credit wallets enforce safe posting limits per day.</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={20} color="#3b82f6" /> The Credit System
              </h3>
              <div style={{ background: '#1f2937', borderRadius: '12px', padding: '1.5rem', color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '1rem' }}>To protect your connected accounts from being flagged as spam, ThreadlyAI uses a strict credit wallet system. You receive a set amount of credits per platform.</p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.25rem' }}><strong>1 Scan = 0 Credits</strong> (Scanning is unlimited)</li>
                  <li style={{ marginBottom: '0.25rem' }}><strong>1 AI Drafted Reply = 1 Credit</strong></li>
                  <li>When you exhaust a platform's daily credits (e.g. 50/50 for HackerNews), ThreadlyAI stops drafting replies for that platform until the next reset to ensure maximum account health.</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => setShowInfoModal(false)}
              className="btn btn-primary hover-pop"
              style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '12px', fontSize: '1rem', background: 'linear-gradient(to right, #a855f7, #ec4899)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-dark)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))', padding: '0.4rem', borderRadius: '8px' }}>
            <Shield size={20} color="white" />
          </div>
          <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.25rem' }}>ThreadlyAI</span>
        </div>
        <p style={{ fontSize: '0.8rem' }}>© 2026 ThreadlyAI. Built for founders who are serious about organic growth.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
          {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
            <a key={link} href="#" className="landing-nav-link" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
