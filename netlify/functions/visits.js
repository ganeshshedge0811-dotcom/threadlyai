// netlify/functions/visits.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback to anonymous key if service role key is not available, though for insert service role is safer.
const supabase = createClient(supabaseUrl, supabaseKey || process.env.VITE_SUPABASE_ANON_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { visitorId } = JSON.parse(event.body || '{}');

    if (!visitorId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'VisitorId is required' }) };
    }

    const { data, error } = await supabase
      .from('website_visits')
      .insert([{ visitor_id: visitorId }]);

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Visit logged' }),
    };
  } catch (error) {
    console.error('Error logging visit:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to record visit' }),
    };
  }
};
