// netlify/functions/admin-data.js
// Handles GET /api/admin/data
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const authHeader = event.headers.authorization || '';
  if (authHeader !== 'threadlyai2024') {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const [waitlistRes, feedbackRes, usersRes, visitsRes] = await Promise.all([
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      supabase.from('feedback').select('*').order('created_at', { ascending: false }),
      supabase.auth.admin.listUsers(),
      supabase.from('website_visits').select('id, visitor_id, created_at').order('created_at', { ascending: false }),
    ]);

    if (waitlistRes.error) throw waitlistRes.error;
    if (feedbackRes.error) throw feedbackRes.error;
    if (usersRes.error) throw usersRes.error;
    if (visitsRes.error) throw visitsRes.error;

    // Normalize field names to match existing AdminScreen expectations
    const waitlist = (waitlistRes.data || []).map(r => ({
      id: r.id,
      firstName: r.first_name || '',
      lastName: r.last_name || '',
      email: r.email,
      useCase: r.use_case || '',
      createdAt: r.created_at,
    }));

    const feedback = (feedbackRes.data || []).map(r => ({
      id: r.id,
      rating: r.rating,
      category: r.category,
      message: r.message,
      createdAt: r.created_at,
    }));

    const users = (usersRes.data?.users || []).map(u => ({
      id: u.id,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0],
      email: u.email,
      createdAt: u.created_at,
      lastLoginAt: u.last_sign_in_at || u.created_at,
    }));

    const visits = (visitsRes.data || []).map(v => ({
      id: v.id,
      visitorId: v.visitor_id,
      timestamp: v.created_at,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ waitlist, feedback, users, visits }) };
  } catch (err) {
    console.error('Admin data error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
