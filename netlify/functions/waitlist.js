// netlify/functions/waitlist.js
// Handles POST /api/waitlist
// Saves to Supabase + sends welcome email via Resend
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { firstName = 'Friend', email } = JSON.parse(event.body || '{}');

    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
    }

    // 1. Upsert into Supabase
    const { error: dbError } = await supabase
      .from('waitlist')
      .upsert({ email, first_name: firstName }, { onConflict: 'email' });

    if (dbError) {
      console.error('Supabase error:', dbError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
    }

    // 2. Get position on waitlist
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    const position = count ?? '?';

    // 3. Send welcome email via Resend
    try {
      await resend.emails.send({
        from: 'ThreadlyAI <onboarding@resend.dev>',
        to: [email],
        subject: `🎉 You're on the ThreadlyAI waitlist! (#${position})`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0B0F19;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:2rem;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:16px;padding:2.5rem;text-align:center;margin-bottom:2rem;">
      <div style="font-size:2.5rem;margin-bottom:0.5rem;">🚀</div>
      <h1 style="color:#fff;margin:0;font-size:1.75rem;font-weight:800;">You're In!</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0.5rem 0 0;font-size:1rem;">Welcome to the ThreadlyAI waitlist, ${firstName}.</p>
    </div>

    <!-- Position Badge -->
    <div style="background:#131A2A;border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1.5rem;">
      <div style="font-size:0.8rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Your Waitlist Position</div>
      <div style="font-size:3rem;font-weight:800;color:#6366f1;line-height:1;">#${position}</div>
      <div style="font-size:0.85rem;color:#6b7280;margin-top:0.25rem;">Early access = exclusive pricing 🎁</div>
    </div>

    <!-- What to expect -->
    <div style="background:#131A2A;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;">
      <h3 style="color:#f3f4f6;margin:0 0 1rem;font-size:1rem;">What happens next?</h3>
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <span style="font-size:1.1rem;min-width:24px;">🔍</span>
          <div>
            <strong style="color:#e5e7eb;font-size:0.9rem;">We're finishing the final polish</strong>
            <p style="color:#9ca3af;font-size:0.8rem;margin:0.2rem 0 0;">The platform is nearly ready. AI monitoring, draft generation, and account protection are all built and tested.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <span style="font-size:1.1rem;min-width:24px;">📧</span>
          <div>
            <strong style="color:#e5e7eb;font-size:0.9rem;">You'll get an exclusive invite</strong>
            <p style="color:#9ca3af;font-size:0.8rem;margin:0.2rem 0 0;">When we launch, waitlist members get first access and a locked-in early-adopter price — before it goes public.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <span style="font-size:1.1rem;min-width:24px;">💡</span>
          <div>
            <strong style="color:#e5e7eb;font-size:0.9rem;">Your feedback shapes the product</strong>
            <p style="color:#9ca3af;font-size:0.8rem;margin:0.2rem 0 0;">If you left feedback on our site, it's already being reviewed. We build based on what early users tell us.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:1rem;">
      <p style="color:#6b7280;font-size:0.8rem;margin:0;">
        You're receiving this because you signed up at <strong style="color:#a855f7;">threadlyai.app</strong><br>
        Questions? Reply to this email — we read every one.
      </p>
    </div>
  </div>
</body>
</html>
        `,
      });
    } catch (emailErr) {
      // Non-fatal — email failure shouldn't break the signup
      console.error('Email send failed (non-fatal):', emailErr.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Added to waitlist', position }),
    };
  } catch (err) {
    console.error('Waitlist function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
