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
    const [waitlistRes, feedbackRes] = await Promise.all([
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      supabase.from('feedback').select('*').order('created_at', { ascending: false }),
    ]);

    if (waitlistRes.error) throw waitlistRes.error;
    if (feedbackRes.error) throw feedbackRes.error;

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

    return { statusCode: 200, headers, body: JSON.stringify({ waitlist, feedback }) };
  } catch (err) {
    console.error('Admin data error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
