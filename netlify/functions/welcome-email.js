import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const { email, name } = JSON.parse(event.body || '{}');

    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
    }

    const data = await resend.emails.send({
      from: 'ThreadlyAI <onboarding@resend.dev>',
      to: email,
      subject: "Welcome to ThreadlyAI — Let's find your first customer! 🚀",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Welcome to ThreadlyAI, ${name || 'there'}! 🎉</h2>
          <p>Your ThreadlyAI workspace is ready. We're excited to help you find high-intent conversations for your product.</p>
          <p><strong>What's next?</strong></p>
          <ul>
            <li>Set up your product details & keywords</li>
            <li>Connect your platform API keys</li>
            <li>Start reviewing AI-drafted replies</li>
          </ul>
          <p>Happy growing!<br/>The ThreadlyAI Team</p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send welcome email' }) };
  }
};
