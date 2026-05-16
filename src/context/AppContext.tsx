import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Platform = 'Reddit' | 'Twitter' | 'LinkedIn' | 'HackerNews';

export type Thread = {
  id: string;
  title: string;
  platform: Platform;
  source: string;
  postedTime: string;
  timeAgo: string;
  bodyPreview: string;
  snippet: string;
  aiDraft: string;
  aiReply: string;
  intentScore: 'High' | 'Medium' | 'Low';
  intent: 'High' | 'Medium' | 'Low';
  intentValue: number;
  upvotes?: number;
  comments?: number;
  url: string;
};

export type ApprovedReply = {
  id: string;
  threadId?: string;
  title: string;
  platform: Platform;
  source: string;
  replyText: string;
  status: 'Pending' | 'Posted' | 'Failed' | 'Scheduled';
  scheduledTime?: string;
};

type AppState = {
  threads: Thread[];
  approvedReplies: ApprovedReply[];
  creditWallets: {
    reddit: number;
    twitter: number;
    linkedin: number;
    hackernews: number;
  };
  lastPostTime: string | null;
  karma: number;
  settings: any;
  isScanning: boolean;
  notifications: Notification[];
  approveThread: (id: string, editedReply: string) => Promise<void>;
  rejectThread: (id: string) => Promise<void>;
  postReply: (id: string) => Promise<void>;
  postManually: (id: string) => Promise<void>;
  retryWithBackup: (id: string) => Promise<void>;
  saveSettings: (settings: any) => Promise<void>;
  scheduleReply: (id: string, scheduledTime: string) => Promise<void>;
  refreshThreads: () => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
};

export type Notification = {
  id: string;
  text: string;
  platform?: string;
  color?: string;
  time: string;
  type: 'success' | 'new' | 'rejected' | 'info';
  read: boolean;
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [approvedReplies, setApprovedReplies] = useState<ApprovedReply[]>([]);
  const [settings, setSettings] = useState<any>({
    productName: '',
    productDescription: '',
    targetAudience: '',
    competitors: '',
    tone: 'Friendly Expert',
    platforms: ['Reddit', 'Twitter', 'LinkedIn', 'HackerNews'],
    keywords: '',
  });

  // Local state for MVP (not persisted to DB yet)
  const [creditWallets, setCreditWallets] = useState({ reddit: 150, twitter: 150, linkedin: 100, hackernews: 50 });
  const [karma, setKarma] = useState(1250);
  const [lastPostTime, _setLastPostTime] = useState<string | null>('10:45 AM');
  const [isScanning, setIsScanning] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add a notification helper
  const notify = (text: string, type: 'success' | 'new' | 'rejected' | 'info', platform?: string, color?: string) => {
    setNotifications(prev => [{
      id: `n_${Date.now()}`,
      text,
      platform,
      color,
      time: 'Just now',
      type,
      read: false
    }, ...prev].slice(0, 50));
  };

  // Fetch Data from Supabase
  const fetchData = async () => {
    if (!user) {
      setThreads([]);
      setApprovedReplies([]);
      return;
    }

    try {
      // Fetch Settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (settingsData) {
        setSettings({
          productName: settingsData.product_name || '',
          productDescription: settingsData.product_description || '',
          targetAudience: settingsData.target_audience || '',
          competitors: settingsData.competitors || '',
          tone: settingsData.tone || 'Friendly Expert',
          keywords: settingsData.keywords || '',
          platforms: ['Reddit', 'Twitter', 'LinkedIn', 'HackerNews'],
        });
      }

      // Fetch Threads
      const { data: threadsData } = await supabase
        .from('threads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (threadsData && threadsData.length > 0) {
        setThreads(threadsData.map(t => ({
          id: t.id,
          title: t.body_preview.substring(0, 40) + '...',
          platform: t.platform as Platform,
          source: t.author,
          postedTime: t.created_at,
          timeAgo: 'Recently',
          bodyPreview: t.body_preview,
          snippet: t.body_preview.substring(0, 80) + '...',
          aiDraft: '', // Will be generated
          aiReply: '',
          intentScore: 'High',
          intent: 'High',
          intentValue: 9,
          upvotes: t.upvotes,
          comments: t.comments,
          url: t.url
        })));
      } else {
        setThreads([]);
      }

      // Fetch Approved Replies
      const { data: repliesData } = await supabase
        .from('approved_replies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (repliesData) {
        setApprovedReplies(repliesData.map(r => ({
          id: r.id,
          threadId: r.thread_id,
          title: 'Thread Reply',
          platform: r.platform as Platform,
          source: r.author,
          replyText: r.reply_text,
          status: r.status as any,
          scheduledTime: r.scheduled_for,
        })));
      }

    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
      // Fail silently without setting fake data
      if (threads.length === 0) {
        setThreads([]);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const approveThread = async (id: string, editedReply: string) => {
    if (!user) return;
    const thread = threads.find(t => t.id === id);
    if (!thread) return;

    try {
      if (!id.startsWith('demo_')) {
        const { data, error } = await supabase
          .from('approved_replies')
          .insert({
            user_id: user.id,
            thread_id: thread.id,
            platform: thread.platform,
            author: thread.source,
            reply_text: editedReply,
            status: 'Scheduled'
          })
          .select()
          .single();

        if (error) throw error;
        
        // Optimistically update UI
        setApprovedReplies(prev => [{
          id: data.id,
          threadId: thread.id,
          title: thread.title,
          platform: thread.platform,
          source: thread.source,
          replyText: editedReply,
          status: 'Scheduled'
        }, ...prev]);

        await supabase.from('threads').delete().eq('id', id);
      } else {
        // Mock demo data behavior
        setApprovedReplies(prev => [{
          id: `app_demo_${Date.now()}`,
          threadId: thread.id,
          title: thread.title,
          platform: thread.platform,
          source: thread.source,
          replyText: editedReply,
          status: 'Scheduled'
        }, ...prev]);
      }

      setThreads(prev => prev.filter(t => t.id !== id));
      notify('Approved reply for', 'success', thread.platform, '#00d26a');

    } catch (error) {
      console.error('Failed to approve thread:', error);
      alert('Failed to save to database. Have you run the schema.sql script?');
    }
  };

  const rejectThread = async (id: string) => {
    if (!user) return;
    try {
      if (!id.startsWith('demo_')) {
        await supabase.from('threads').delete().eq('id', id);
      }
      setThreads(prev => prev.filter(t => t.id !== id));
      notify('Rejected thread', 'rejected');
    } catch (error) {
      console.error('Failed to reject thread:', error);
    }
  };

  const postReply = async (id: string) => {
    if (!user) return;
    const reply = approvedReplies.find(r => r.id === id);
    if (!reply) return;

    try {
      if (!id.startsWith('demo_') && !id.startsWith('app_demo_')) {
        await supabase
          .from('approved_replies')
          .update({ status: 'Posted' })
          .eq('id', id);
      }

      setApprovedReplies(prev => prev.map(r => r.id === id ? { ...r, status: 'Posted' } : r));
      
      // Deduct credit
      setCreditWallets(prev => ({
        ...prev,
        [reply.platform.toLowerCase()]: prev[reply.platform.toLowerCase() as keyof typeof prev] - 1
      }));
      setKarma(prev => prev + Math.floor(Math.random() * 5) + 1);
      
      notify('Successfully posted to', 'success', reply.platform, '#00d26a');
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply to database.');
    }
  };

  const postManually = async (id: string) => {
    await postReply(id);
  };

  const retryWithBackup = async (id: string) => {
    await postReply(id);
  };

  const scheduleReply = async (id: string, scheduledTime: string) => {
    if (!user) return;
    try {
      if (!id.startsWith('demo_') && !id.startsWith('app_demo_')) {
        await supabase
          .from('approved_replies')
          .update({ status: 'Scheduled', scheduled_for: new Date(scheduledTime).toISOString() })
          .eq('id', id);
      }
      setApprovedReplies(prev => prev.map(r => r.id === id ? { ...r, status: 'Scheduled', scheduledTime } : r));
      notify(`Rescheduled reply for ${scheduledTime}`, 'info');
    } catch (error) {
      console.error('Failed to schedule reply:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    if (!user) return;
    try {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        product_name: newSettings.productName,
        product_description: newSettings.productDescription,
        target_audience: newSettings.targetAudience,
        competitors: newSettings.competitors,
        tone: newSettings.tone,
        keywords: newSettings.keywords,
        updated_at: new Date().toISOString()
      });
      setSettings(newSettings);
      notify('Settings saved to database', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings to database. Have you run the schema.sql script?');
    }
  };

  const refreshThreads = async () => {
    if (!user) return;
    setIsScanning(true);
    
    try {
      const response = await fetch('/api/scan/reddit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          keywords: settings.keywords || settings.productName,
          productName: settings.productName,
          productDescription: settings.productDescription,
          subreddits: ['SaaS', 'Entrepreneur', 'startups'] // Default subreddits for MVP
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.savedCount > 0) {
        notify(`Discovered ${data.savedCount} new high-intent threads!`, 'new', 'Reddit', '#ff4500');
        // Re-fetch from DB to update UI
        await fetchData();
      } else {
        notify('Scan complete. No new high-intent threads found.', 'info');
      }
    } catch (error) {
      console.error('Error triggering scan:', error);
      notify('Failed to connect to scanner backend.', 'rejected');
    } finally {
      setIsScanning(false);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider value={{
      threads,
      approvedReplies,
      creditWallets,
      lastPostTime,
      karma,
      settings,
      isScanning,
      notifications,
      approveThread,
      rejectThread,
      postReply,
      postManually,
      retryWithBackup,
      saveSettings,
      scheduleReply,
      refreshThreads,
      dismissNotification,
      markAllNotificationsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
