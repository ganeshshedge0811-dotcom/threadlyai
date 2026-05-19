import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type User = {
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = async (supabaseUser: SupabaseUser) => {
    // Set user immediately from session data (no DB call) — this is instant
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    });
    // Then fetch profile name from DB in the background (non-blocking)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', supabaseUser.id)
        .single();
      if (profile?.name) {
        setUser(prev => prev ? { ...prev, name: profile.name } : prev);
      }
    } catch {
      // Non-critical — user is already set without profile name
    }
  };

  useEffect(() => {
    // Safety timeout: never show loading screen for more than 1.5 seconds
    const timeout = setTimeout(() => {
      setIsLoading(false);
      // Check local storage for mock user
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) setUser(JSON.parse(mockUser));
    }, 1500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(timeout); // Clear timeout as soon as we get a response
      if (session?.user) {
        // Set loading false IMMEDIATELY, then fetch profile in background
        setIsLoading(false);
        fetchAndSetUser(session.user);
      } else {
        // Fallback to local storage if no session
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser) {
          setUser(JSON.parse(mockUser));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string, name?: string) => {
    try {
      if (name) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: password || 'dummy_password_123!', // Require a real password in production
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Insert profile
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            name
          });

          // Dispatch Welcome Email
          fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
          }).catch(err => console.error('Failed to send welcome email:', err));
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password || 'dummy_password_123!',
        });
        if (error) throw error;
        
        // Dispatch Welcome Email on login
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: email.split('@')[0] })
        }).catch(err => console.error('Failed to send welcome email:', err));
      }
    } catch (err: any) {
      console.warn("Supabase auth failed. Attempting local mock fallback.", err);
      // Fallback for demo when Supabase is offline
      if (err.message === 'Failed to fetch' || err.message.includes('network') || err.message.toLowerCase().includes('fetch')) {
        const mockUser = { id: `mock-${Date.now()}`, email, name: name || email.split('@')[0] };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        setUser(mockUser);
        
        // Dispatch Welcome Email to node server just for demo logs
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: name || email.split('@')[0] })
        }).catch(() => {});
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard/inbox`,
          scopes: 'email profile',
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn("Google auth failed.", err);
      throw err;
    }
  };


  const logout = async () => {
    // Always clear user state immediately so UI updates right away
    setUser(null);
    localStorage.removeItem('mockUser');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error (non-critical):', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth?type=recovery',
      });
      if (error) throw error;
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        console.warn("Supabase offline. Mocking password reset success.");
        return;
      }
      throw err;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        console.warn("Supabase offline. Mocking password update success.");
        return;
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

