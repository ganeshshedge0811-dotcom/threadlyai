import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Inbox, CheckCircle, BarChart2, Settings, AlertTriangle, Shield, Bell, Search, LogOut, Menu, X, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { creditWallets, lastPostTime, threads, approvedReplies, isScanning, refreshThreads, notifications, dismissNotification, markAllNotificationsRead } = useAppContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const totalCredits = Object.values(creditWallets).reduce((a, b) => a + b, 0);
  const isApproachingLimit = totalCredits < 30;
  const isLimitReached = totalCredits < 15;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar glass-panel ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div 
            onClick={() => navigate('/dashboard/inbox')} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))' }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 className="text-gradient" style={{ marginBottom: 0, fontSize: '1.35rem', fontWeight: 800 }}>Thredly</h1>
              <p style={{ fontSize: '0.65rem', marginTop: '0.1rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Organic Acquisition</p>
            </div>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Main Menu</span>
          </div>
          <NavLink to="/dashboard/inbox" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <Inbox size={18} />
            Inbox
            {threads.length > 0 && (
              <span className="badge" style={{ 
                marginLeft: 'auto',
                background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))',
                color: 'white'
              }}>{threads.length}</span>
            )}
          </NavLink>
          <NavLink to="/dashboard/approved" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <CheckCircle size={18} />
            Approved Queue
            {approvedReplies.length > 0 && (
              <span className="badge" style={{ 
                marginLeft: 'auto',
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                color: 'black'
              }}>{approvedReplies.length}</span>
            )}
          </NavLink>
          <NavLink to="/dashboard/analytics" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <BarChart2 size={18} />
            Analytics
          </NavLink>

          <div style={{ padding: '0 1rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Account</span>
          </div>
          <NavLink to="/dashboard/billing" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <Shield size={18} />
            Billing & Plans
          </NavLink>
          <NavLink to="/dashboard/onboarding" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <Settings size={18} />
            Settings
          </NavLink>
        </nav>

        {/* Credit Balance Panel */}
        <div className="glass-card" style={{ 
          margin: '1rem', padding: '1.25rem', 
          borderRadius: '16px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px', 
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--primary-indigo)', filter: 'blur(40px)', opacity: 0.25
          }} />
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <div className="flex items-center gap-2">
              <div style={{ 
                padding: '6px', borderRadius: '8px', 
                background: isLimitReached ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <div title="Credit Health Tiers:&#10;🟢 Good: 300+ credits&#10;🟡 Moderate: 100-299 credits&#10;🟠 Bad: 20-99 credits&#10;🔴 Worst: 0-19 credits">
                  <AlertTriangle size={14} style={{ color: isLimitReached ? 'var(--danger-red)' : 'var(--primary-indigo)', cursor: 'help' }} />
                </div>
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.01em' }}>Credit Wallets</span>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', 
              borderRadius: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 
            }}>
              {totalCredits} left
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { name: 'Reddit', key: 'reddit' as const, color: '#ff4500', max: 150 },
              { name: 'Twitter', key: 'twitter' as const, color: '#1da1f2', max: 150 },
              { name: 'LinkedIn', key: 'linkedin' as const, color: '#0077b5', max: 100 },
              { name: 'HackerNews', key: 'hackernews' as const, color: '#ff6600', max: 50 },
            ].map(platform => {
              const value = creditWallets[platform.key];
              const percentage = Math.min(100, Math.max(0, (value / platform.max) * 100));
              return (
                <div key={platform.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{platform.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{value} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>/ {platform.max}</span></span>
                  </div>
                  <div style={{ 
                    height: '6px', backgroundColor: 'rgba(0,0,0,0.4)', 
                    borderRadius: '3px', overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      background: `linear-gradient(90deg, ${platform.color}aa 0%, ${platform.color} 100%)`,
                      borderRadius: '3px',
                      transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow: `0 0 10px ${platform.color}66`
                    }} />
                  </div>
                </div>
              );
            })}
            
            {isApproachingLimit && (
              <div className="credit-warning" style={{ 
                backgroundColor: isLimitReached ? 'rgba(244, 63, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
                padding: '0.5rem 0.6rem', borderRadius: '8px', marginTop: '0.25rem', 
                color: isLimitReached ? 'var(--danger-red)' : '#facc15',
                fontSize: '0.75rem', fontWeight: 500,
                border: `1px solid ${isLimitReached ? 'rgba(244, 63, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'}`
              }}>
                {isLimitReached ? '⚠ Out of automated credits.' : '⚡ Running low on credits.'}
              </div>
            )}
            
            <div className="flex justify-between" style={{ 
              marginTop: '0.25rem', paddingTop: '0.875rem', 
              borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.75rem' 
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Health</span>
              <div className="flex items-center gap-1.5">
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-green)', boxShadow: '0 0 8px var(--primary-green)' }} />
                <span style={{ color: 'var(--primary-green)', fontWeight: 600 }}>Good</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="flex items-center gap-4">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="header-search">
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search threads, replies..." 
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-main)', 
                  fontFamily: 'var(--font-family)', fontSize: '0.8rem', outline: 'none',
                  width: '200px'
                }} 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Scan / Refresh Button */}
            <button 
              className="btn btn-outline"
              onClick={refreshThreads}
              disabled={isScanning}
              style={{ 
                padding: '0.35rem 0.75rem', fontSize: '0.75rem', 
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                opacity: isScanning ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} style={{ 
                animation: isScanning ? 'spin 1s linear infinite' : 'none' 
              }} />
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </button>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {lastPostTime && `Last post: ${lastPostTime}`}
            </span>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                className="header-icon-btn" 
                title="Notifications"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) markAllNotificationsRead();
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-dot" />}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '340px', maxHeight: '400px', overflowY: 'auto',
                  backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '12px', boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                  zIndex: 200, animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ 
                    padding: '1rem 1rem 0.75rem', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Notifications</h4>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          markAllNotificationsRead();
                          setNotifOpen(false);
                        }}
                        style={{ 
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--primary-green)', fontSize: '0.7rem', fontWeight: 500,
                          fontFamily: 'var(--font-family)'
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    <div>
                      {notifications.slice(0, 8).map(notif => (
                        <div 
                          key={notif.id}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                            padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                            backgroundColor: notif.read ? 'transparent' : 'rgba(0, 210, 106, 0.03)',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div style={{ 
                            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                            backgroundColor: notif.type === 'rejected' ? 'var(--danger-red)' : 
                                           notif.type === 'new' ? '#facc15' :
                                           notif.type === 'info' ? '#818cf8' : 'var(--primary-green)'
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                              {notif.text}{' '}
                              {notif.platform && (
                                <strong style={{ color: notif.color || 'var(--text-main)' }}>{notif.platform}</strong>
                              )}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                            style={{ 
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--text-muted)', display: 'flex', padding: '2px',
                              opacity: 0.5, flexShrink: 0
                            }}
                            title="Dismiss"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="header-avatar" title="Account">
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <button 
              className="header-icon-btn" 
              title="Sign Out"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-card" style={{
            background: '#111827', border: '1px solid #1f2937', borderRadius: '20px', 
            width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <LogOut size={32} color="var(--danger-red)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '0.5rem' }}>
              Sign Out
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Are you sure you want to sign out of Thredly?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-outline hover-lift"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #374151', color: '#e5e7eb' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn hover-pop"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'var(--danger-red)', color: 'white', border: 'none', fontWeight: 600 }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Layout;
