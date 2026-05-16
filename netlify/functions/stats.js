// netlify/functions/stats.js
// Securely returns ONLY counts for the landing page (no PII)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const [waitlistRes, feedbackRes] = await Promise.all([
      supabase.from('waitlist').select('id', { count: 'exact', head: true }),
      supabase.from('feedback').select('id', { count: 'exact', head: true }),
    ]);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        waitlistCount: waitlistRes.count || 0, 
        feedbackCount: feedbackRes.count || 0 
      }) 
    };
  } catch (err) {
    console.error('Stats error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
