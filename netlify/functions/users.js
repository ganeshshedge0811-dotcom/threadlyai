// netlify/functions/users.js
// Supabase automatically tracks users in its built-in auth.users table.
// This function exists simply to catch the frontend POST /api/users requests 
// gracefully so we don't get 404 errors in the console.

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

  // We don't actually need to store the user since Supabase handles auth seamlessly.
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, message: 'User recognized by Supabase' }),
  };
};
