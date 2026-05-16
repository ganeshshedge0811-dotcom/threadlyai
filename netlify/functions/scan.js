// netlify/functions/scan.js
// Serverless version of the Reddit scanner
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

const SCORING_PROMPT = `
You are an AI lead generation expert. Your job is to analyze a social media post and determine if the author is a good potential customer for the user's product.

You must reply with ONLY a valid JSON object in this exact format, with no markdown formatting or extra text:
{
  "intent": "High" | "Medium" | "Low",
  "score": 1-10,
  "reason": "Short 1 sentence explanation of why they are or are not a good fit"
}

Intent definitions:
- High: The user is explicitly asking for a solution to a problem your product solves.
- Medium: The user is discussing the problem space or expressing frustration, but not explicitly asking for a product.
- Low: The post is unrelated, spam, or a competitor.
`;

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
    // 1. Verify Authorization Header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing or invalid Authorization header' }) };
    }
    const token = authHeader.split(' ')[1];

    // 2. Securely get user from Supabase using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized token' }) };
    }

    const userId = user.id; // SECURE: Extracted from verified JWT
    const { keywords, productName, productDescription, subreddits = ['SaaS', 'Entrepreneur', 'marketing'] } = JSON.parse(event.body || '{}');

    if (!keywords) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId or keywords' }) };
    }

    console.log(`🔍 Starting Reddit scan for User ${userId}...`);
    const foundThreads = [];

    // 1. Fetch posts from Reddit
    const fetchSubreddit = async (sub) => {
      try {
        const res = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=10`, {
          headers: { 'User-Agent': 'ThreadlyAI/1.0.0' }
        });
        const data = await res.json();
        return data?.data?.children || [];
      } catch (err) {
        console.error(`Error fetching r/${sub}:`, err.message);
        return [];
      }
    };

    const results = await Promise.all(subreddits.map(fetchSubreddit));
    let allPosts = results.flat();

    // 2. Filter posts
    let validPosts = allPosts.map(p => p.data).filter(p => !p.stickied && !p.is_video && p.selftext && p.selftext.length > 50);

    const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    if (keywordArray.length > 0) {
      validPosts = validPosts.filter(post => {
        const fullText = (post.title + ' ' + post.selftext).toLowerCase();
        return keywordArray.some(keyword => fullText.includes(keyword));
      });
    }

    console.log(`Found ${validPosts.length} keyword matches. Scoring with AI...`);

    // 3. Score with Gemini
    for (const post of validPosts.slice(0, 10)) {
      try {
        const postContent = `
Product Name: ${productName}
Product Description: ${productDescription}

---
REDDIT POST TO ANALYZE:
Title: ${post.title}
Body: ${post.selftext.substring(0, 1000)}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: postContent,
          config: { systemInstruction: SCORING_PROMPT, temperature: 0.2 }
        });

        const rawText = response.text.trim();
        const jsonStr = rawText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        const scoreData = JSON.parse(jsonStr);

        if (scoreData.intent === 'High' || scoreData.intent === 'Medium') {
          const { data: existing } = await supabase
            .from('threads')
            .select('id')
            .eq('url', `https://reddit.com${post.permalink}`)
            .eq('user_id', userId)
            .single();

          if (!existing) {
            const { data: insertedData, error: insertError } = await supabase
              .from('threads')
              .insert({
                user_id: userId,
                platform: 'Reddit',
                author: `u/${post.author}`,
                body_preview: `${post.title}\n\n${post.selftext.substring(0, 200)}...`,
                upvotes: post.ups,
                comments: post.num_comments,
                url: `https://reddit.com${post.permalink}`,
              })
              .select()
              .single();

            if (!insertError) {
              console.log(`✅ Saved ${scoreData.intent} intent: ${post.title}`);
              foundThreads.push({ ...insertedData, scoreData });
            }
          }
        }
      } catch (aiError) {
        console.error(`AI Scoring Error:`, aiError.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        scannedCount: validPosts.length,
        savedCount: foundThreads.length,
        threads: foundThreads,
      }),
    };
  } catch (err) {
    console.error('Scan function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error during scan' }) };
  }
};
