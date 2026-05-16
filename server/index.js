import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Verify required env variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
  console.error("❌ Missing required environment variables. Check your .env file.");
  console.error("- VITE_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY (Get from Supabase -> Project Settings -> API)");
  console.error("- VITE_GEMINI_API_KEY");
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

// System prompt for scoring Reddit posts
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

app.post('/api/scan/reddit', async (req, res) => {
  const { userId, keywords, productName, productDescription, subreddits = ['SaaS', 'Entrepreneur', 'marketing'] } = req.body;

  if (!userId || !keywords) {
    return res.status(400).json({ error: 'Missing userId or keywords' });
  }

  console.log(`🔍 Starting Reddit scan for User ${userId}...`);
  const foundThreads = [];

  try {
    // 1. Fetch posts from Reddit
    // For MVP, we'll scan the hot/new posts from the requested subreddits
    const searchPromises = subreddits.map(sub => 
      axios.get(`https://www.reddit.com/r/${sub}/new.json?limit=10`, {
        headers: { 'User-Agent': 'BenoApp/1.0.0 (Node.js)' }
      }).catch(err => {
        console.error(`Error fetching r/${sub}:`, err.message);
        return { data: { data: { children: [] } } };
      })
    );

    const results = await Promise.all(searchPromises);
    
    let allPosts = [];
    results.forEach(result => {
      const posts = result.data?.data?.children || [];
      allPosts = [...allPosts, ...posts];
    });

    // 2. Filter out stickied posts, ads, and empty bodies
    let validPosts = allPosts.map(p => p.data).filter(p => !p.stickied && !p.is_video && p.selftext && p.selftext.length > 50);

    // Filter by keywords (case insensitive)
    const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    if (keywordArray.length > 0) {
      validPosts = validPosts.filter(post => {
        const fullText = (post.title + ' ' + post.selftext).toLowerCase();
        return keywordArray.some(keyword => fullText.includes(keyword));
      });
    }

    console.log(`Found ${validPosts.length} potential keyword matches. Scoring with AI...`);

    // 3. Score the posts using Gemini
    for (const post of validPosts) {
      try {
        const postContent = `
Product Name: ${productName}
Product Description: ${productDescription}

---
REDDIT POST TO ANALYZE:
Title: ${post.title}
Body: ${post.selftext.substring(0, 1000)} // truncate to save tokens
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: postContent,
          config: {
            systemInstruction: SCORING_PROMPT,
            temperature: 0.2,
          }
        });

        const rawText = response.text.trim();
        // Clean markdown JSON formatting if present
        const jsonStr = rawText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
        const scoreData = JSON.parse(jsonStr);

        // Only save High or Medium intent posts
        if (scoreData.intent === 'High' || scoreData.intent === 'Medium') {
          // Check if thread already exists to avoid duplicates
          const { data: existing } = await supabase
            .from('threads')
            .select('id')
            .eq('url', `https://reddit.com${post.permalink}`)
            .eq('user_id', userId)
            .single();

          if (!existing) {
            const newThread = {
              user_id: userId,
              platform: 'Reddit',
              author: `u/${post.author}`,
              body_preview: `${post.title}\n\n${post.selftext.substring(0, 200)}...`,
              upvotes: post.ups,
              comments: post.num_comments,
              url: `https://reddit.com${post.permalink}`,
            };

            const { data: insertedData, error: insertError } = await supabase
              .from('threads')
              .insert(newThread)
              .select()
              .single();

            if (!insertError) {
              console.log(`✅ Saved new ${scoreData.intent} intent thread: ${post.title}`);
              foundThreads.push({ ...insertedData, scoreData });
            }
          }
        }
      } catch (aiError) {
        console.error(`AI Scoring Error for post ${post.id}:`, aiError.message);
      }
    }

    res.json({ 
      success: true, 
      scannedCount: validPosts.length, 
      savedCount: foundThreads.length,
      threads: foundThreads
    });

  } catch (error) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: 'Internal server error during scan' });
  }
});

app.post('/api/email/welcome', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
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
    res.json({ success: true, data });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// --- Local JSON DB for Waitlist & Feedback ---
const dataFilePath = path.join(process.cwd(), 'server', 'data.json');
const getDb = () => {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({ waitlist: [], feedback: [] }));
  }
  return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
};
const saveDb = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

app.post('/api/waitlist', (req, res) => {
  const { firstName, lastName, email, useCase } = req.body;
  if (!email || !firstName) return res.status(400).json({ error: 'First name and email required' });

  try {
    const db = getDb();
    const existingIndex = db.waitlist.findIndex(u => u.email === email);
    
    const entry = {
      id: Date.now().toString(),
      firstName,
      lastName: lastName || '',
      email,
      useCase: useCase || '',
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      db.waitlist[existingIndex] = { ...db.waitlist[existingIndex], ...entry, id: db.waitlist[existingIndex].id };
    } else {
      db.waitlist.push(entry);
    }
    
    saveDb(db);
    res.json({ success: true, message: 'Added to waitlist' });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: 'Failed to save to waitlist' });
  }
});

app.post('/api/feedback', (req, res) => {
  const { rating, category, message } = req.body;
  if (!rating || !category) return res.status(400).json({ error: 'Rating and category required' });

  try {
    const db = getDb();
    db.feedback.push({
      id: Date.now().toString(),
      rating,
      category,
      message: message || '',
      createdAt: new Date().toISOString()
    });
    saveDb(db);
    res.json({ success: true, message: 'Feedback saved' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.get('/api/admin/data', (req, res) => {
  try {
    res.json(getDb());
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 ThreadlyAI Backend running on http://localhost:${PORT}`);
});
