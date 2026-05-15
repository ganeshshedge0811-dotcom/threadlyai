import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type ValidationErrors = {
  name?: string;
  email?: string;
  password?: string;
};

const AuthScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, login: authLogin, loginWithGoogle, resetPassword, updatePassword } = useAuth();
  const [isSignup, setIsSignup] = useState(searchParams.get('signup') === 'true');
  const isRecoveryMode = location.hash.includes('type=recovery') || searchParams.get('type') === 'recovery';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeEmail, setWelcomeEmail] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect them (unless they are recovering their password)
    if (user && !isRecoveryMode) {
      const from = location.state?.from?.pathname || '/dashboard/inbox';
      if (document.startViewTransition) {
        document.startViewTransition(() => navigate(from, { replace: true }));
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, location, isRecoveryMode]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const p = form.password;
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--danger-red)' };
    if (score <= 2) return { score: 2, label: 'Fair', color: '#facc15' };
    if (score <= 3) return { score: 3, label: 'Good', color: '#fb923c' };
    if (score <= 4) return { score: 4, label: 'Strong', color: 'var(--primary-indigo)' };
    return { score: 5, label: 'Excellent', color: '#00b4d8' };
  }, [form.password]);

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (isSignup && !form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (isSignup && form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // Validate on blur
    const newErrors: ValidationErrors = { ...errors };
    if (field === 'name' && isSignup && !form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (field === 'name') {
      delete newErrors.name;
    }
    if (field === 'email') {
      if (!form.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email';
      else delete newErrors.email;
    }
    if (field === 'password') {
      if (!form.password) newErrors.password = 'Password is required';
      else if (isSignup && form.password.length < 8) newErrors.password = 'At least 8 characters';
      else delete newErrors.password;
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    
    if (isRecoveryMode) {
      if (!form.password || form.password.length < 8) {
        setErrors({ password: 'Password must be at least 8 characters' });
        return;
      }
      setLoading(true);
      try {
        await updatePassword(form.password);
        setPasswordUpdated(true);
        setTimeout(() => navigate('/dashboard/inbox', { replace: true }), 2000);
      } catch (err: any) {
        setErrors({ password: err?.message || 'Failed to update password.' });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isResetPassword) {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setErrors({ email: 'Please enter a valid email' });
        return;
      }
      setLoading(true);
      try {
        await resetPassword(form.email);
        setResetEmailSent(true);
      } catch (err: any) {
        setErrors({ email: err?.message || 'Failed to send reset email.' });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!validate()) return;
    
    setLoading(true);

    try {
      if (isSignup) {
        await authLogin(form.email, form.password, form.name);
        setWelcomeEmail(form.email);
        setShowWelcome(true);
      } else {
        await authLogin(form.email, form.password);
        const from = location.state?.from?.pathname || '/dashboard/inbox';
        if (document.startViewTransition) {
          document.startViewTransition(() => navigate(from, { replace: true }));
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const message = err?.message || 'Authentication failed. Please check your credentials.';
      setErrors({ ...errors, password: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Note: Supabase OAuth handles redirect, so we don't manually navigate here.
    } catch (err: any) {
      setGoogleLoading(false);
      alert('Google authentication failed: ' + err.message);
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    const from = location.state?.from?.pathname || '/dashboard/inbox';
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(from, { replace: true }));
    } else {
      navigate(from, { replace: true });
    }
  };

  const renderFieldError = (field: keyof ValidationErrors) => {
    if (!touched[field] || !errors[field]) return null;
    return (
      <div style={{ 
        fontSize: '0.75rem', color: 'var(--danger-red)', marginTop: '0.35rem',
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        animation: 'fadeIn 0.2s ease'
      }}>
        ⚠ {errors[field]}
      </div>
    );
  };

  return (
    <div className="mesh-bg" style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-family)', padding: '2rem'
    }}>

      {/* Welcome Email Modal */}
      {showWelcome && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="welcome-modal glass-card" style={{
            borderRadius: '24px', padding: '3rem 2.5rem', maxWidth: '440px', width: '100%',
            textAlign: 'center', position: 'relative',
            animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 80px rgba(99,102,241,0.15)'
          }}>
            <button onClick={handleCloseWelcome} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex'
            }}>
              <X size={18} />
            </button>

            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              animation: 'pulseGlow 2s infinite'
            }}>
              <CheckCircle size={36} color="var(--primary-indigo)" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Welcome to Thredly! 🎉
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your account has been created successfully.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
              borderRadius: '16px', padding: '1.25rem', textAlign: 'left',
              marginBottom: '1.5rem', backdropFilter: 'blur(8px)'
            }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Mail size={16} color="#000" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-indigo)' }}>WELCOME EMAIL SENT</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>To: {welcomeEmail}</div>
                </div>
              </div>
              <div style={{ 
                fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6,
                borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem'
              }}>
                <p style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                  Subject: Welcome to Thredly — Let's find your first customer! 🚀
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem' }}>
                  Hey{form.name ? ` ${form.name}` : ''}! Your Thredly workspace is ready. 
                  Start by configuring your product details, keywords, and platforms. 
                  We'll find high-intent conversations for you 24/7.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
              textAlign: 'left', marginBottom: '1.75rem'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                What's next?
              </div>
              {[
                'Set up your product details & keywords',
                'Connect your platform API keys',
                'Start reviewing AI-drafted replies'
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2" style={{ fontSize: '0.8rem' }}>
                  <Sparkles size={14} color="var(--primary-indigo)" />
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleCloseWelcome}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem', fontSize: '0.9rem' }}
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '420px' }}>
        
        {/* Back to home */}
        <button onClick={() => navigate('/')} className="hover-lift" style={{ 
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem',
          fontSize: '0.875rem', fontFamily: 'var(--font-family)', transition: 'all 0.2s'
        }}>
          <ArrowLeft size={16} /> Back to home
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-purple))', padding: '0.4rem', borderRadius: '8px' }}>
              <Shield size={24} color="white" />
            </div>
            <span className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800 }}>Thredly</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {isRecoveryMode ? 'Update password' : isResetPassword ? 'Reset password' : isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isRecoveryMode ? 'Enter your new password below.' : isResetPassword ? 'Enter your email to receive a reset link.' : isSignup ? 'Start finding customers from real conversations.' : 'Sign in to your Thredly dashboard.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card" style={{ 
          borderRadius: '16px', padding: '2rem'
        }}>
          {!isResetPassword && !isRecoveryMode && (
            <>
              {/* Tab Toggle */}
              <div style={{ 
                display: 'flex', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', 
                padding: '4px', marginBottom: '1.5rem'
              }}>
                {['Log In', 'Sign Up'].map(tab => (
                  <button key={tab} onClick={() => { setIsSignup(tab === 'Sign Up'); setErrors({}); setTouched({}); }} className="hover-lift" style={{ 
                    flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                    fontFamily: 'var(--font-family)', fontSize: '0.875rem', fontWeight: 500,
                    transition: 'all 0.2s',
                    backgroundColor: (tab === 'Sign Up') === isSignup ? 'var(--bg-card)' : 'transparent',
                    color: (tab === 'Sign Up') === isSignup ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: (tab === 'Sign Up') === isSignup ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                  }}>
                    {tab}
                  </button>
                ))}
              </div>
            </>
          )}

          {!isResetPassword && !isRecoveryMode && (
            <>
              {/* Google OAuth */}
              <button 
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)',
                  fontFamily: 'var(--font-family)', fontSize: '0.875rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.5rem',
                  opacity: googleLoading ? 0.6 : 1
                }}
              >
                <GoogleIcon />
                {googleLoading ? 'Connecting...' : `Continue with Google`}
              </button>

              {/* Divider */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              </div>
            </>
          )}

          {resetEmailSent ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', 
                background: 'rgba(0, 210, 106, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 1.5rem' 
              }}>
                <CheckCircle size={32} color="#00d26a" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Check your email</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                We've sent a password reset link to <br/><strong>{form.email}</strong>
              </p>
              <button 
                onClick={() => { setIsResetPassword(false); setResetEmailSent(false); }}
                className="btn btn-outline"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Back to login
              </button>
            </div>
          ) : passwordUpdated ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', 
                background: 'rgba(0, 210, 106, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 1.5rem' 
              }}>
                <CheckCircle size={32} color="#00d26a" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Password Updated!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Your password has been changed successfully. Redirecting you...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
              {!isResetPassword && !isRecoveryMode && isSignup && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" placeholder="Your name"
                    autoComplete="name"
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    onBlur={() => handleBlur('name')}
                    style={{ 
                      paddingLeft: '2.5rem',
                      borderColor: touched.name && errors.name ? 'var(--danger-red)' : undefined
                    }}
                  />
                </div>
                {renderFieldError('name')}
              </div>
            )}
            
            {!isRecoveryMode && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    id="email"
                    name="email"
                    type="email" placeholder="you@company.com"
                    autoComplete="email"
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})}
                    onBlur={() => handleBlur('email')}
                    style={{ 
                      paddingLeft: '2.5rem',
                      borderColor: touched.email && errors.email ? 'var(--danger-red)' : undefined
                    }}
                  />
                </div>
                {renderFieldError('email')}
              </div>
            )}
            
            {!isResetPassword && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  {isRecoveryMode ? 'New Password' : 'Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRecoveryMode || isSignup ? 'Create a strong password' : 'Your password'}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})}
                      onBlur={() => handleBlur('password')}
                      style={{ 
                        paddingLeft: '2.5rem', paddingRight: '2.5rem',
                        borderColor: touched.password && errors.password ? 'var(--danger-red)' : undefined
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ 
                      position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center'
                    }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {renderFieldError('password')}

                  {/* Password Strength Indicator */}
                  {(isSignup || isRecoveryMode) && form.password && (
                    <div style={{ marginTop: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                        {[1, 2, 3, 4, 5].map(level => (
                          <div key={level} style={{
                            flex: 1, height: '3px', borderRadius: '2px',
                            backgroundColor: level <= passwordStrength.score ? passwordStrength.color : 'rgba(255,255,255,0.08)',
                            transition: 'background-color 0.3s'
                          }} />
                        ))}
                      </div>
                      <div style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: passwordStrength.color, fontWeight: 500 }}>
                          {passwordStrength.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {form.password.length < 8 ? `${8 - form.password.length} more chars needed` : 'Mix upper, lower, numbers & symbols'}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isSignup && !isRecoveryMode && (
                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => setIsResetPassword(true)} className="hover-lift" style={{ fontSize: '0.8rem', color: 'var(--primary-indigo)', textDecoration: 'none', display: 'inline-block', background: 'none', border: 'none', cursor: 'pointer' }}>Forgot password?</button>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading 
                  ? (isRecoveryMode ? 'Updating...' : isSignup ? 'Creating your workspace...' : isResetPassword ? 'Sending...' : 'Signing in...') 
                  : (isRecoveryMode ? 'Update Password' : isSignup ? 'Create Account →' : isResetPassword ? 'Send Reset Link' : 'Sign In →')
                }
              </button>
              
              {isResetPassword && (
                <button 
                  type="button" 
                  onClick={() => setIsResetPassword(false)}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '0.875rem' }}
                >
                  Back to login
                </button>
              )}
            </form>
          )}

          {isSignup && (
            <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              By signing up, you agree to our{' '}
              <a href="#" style={{ color: 'var(--primary-indigo)', textDecoration: 'none' }}>Terms of Service</a>{' '}
              and{' '}
              <a href="#" style={{ color: 'var(--primary-indigo)', textDecoration: 'none' }}>Privacy Policy</a>.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,210,106,0.3); }
          50% { box-shadow: 0 0 20px 6px rgba(0,210,106,0.15); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
