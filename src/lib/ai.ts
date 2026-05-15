import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Only initialize if a real key is provided
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'your_gemini_key_here' && apiKey.length > 10) {
  ai = new GoogleGenAI({ apiKey });
}

export type UserSettings = {
  productName: string;
  productDescription: string;
  targetAudience: string;
  competitors: string;
  tone: string;
  keywords: string;
};

// Smart template fallback — generates a quality reply without any API key
function generateTemplateDraft(_threadContent: string, platform: string, settings: UserSettings): string {
  const product = settings.productName || 'our tool';
  const desc = settings.productDescription || 'a solution that can help with this';
  const audience = settings.targetAudience || 'people like you';
  const tone = settings.tone || 'Friendly Expert';
  
  const isFriendly = tone.toLowerCase().includes('friend');
  const isProfessional = tone.toLowerCase().includes('profes');

  // Extract the first sentence of the thread as context


  const openers = isFriendly
    ? ["Great question! ", "I've been in this exact situation. ", "This is a common challenge — "]
    : isProfessional
    ? ["This is a well-known challenge in the industry. ", "From a professional standpoint, ", "Worth considering: "]
    : ["Totally understand the frustration. ", "Been there! ", "This hits close to home — "];

  const middles = [
    `The key is finding a solution that's built specifically for ${audience}.`,
    `Most generic tools fall short here because they're not designed for ${audience}.`,
    `The trick is having the right system in place from the start.`,
  ];

  const ctas = [
    `I've been using ${product} for this — ${desc}. Might be worth a look.`,
    `Something that's worked well for me: ${product}. It's designed exactly for ${audience}.`,
    `${product} solves this directly — ${desc}. Sharing in case it helps!`,
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const platformNote = platform === 'Reddit'
    ? '\n\nHope this helps! Happy to answer any questions.'
    : platform === 'Twitter'
    ? ' (DM if you want details!)'
    : '';

  return `${pick(openers)}${pick(middles)}\n\n${pick(ctas)}${platformNote}`;
}

export async function generateReplyDraft(
  threadContent: string,
  platform: string,
  settings: UserSettings
): Promise<string> {
  // If no real API key, use smart template fallback
  if (!ai) {
    // Simulate a short "thinking" delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateTemplateDraft(threadContent, platform, settings);
  }

  const prompt = `
You are an expert social media manager and growth marketer. Your task is to write a highly contextual, helpful, and natural-sounding reply to a social media thread that subtly introduces a product.

### Product Context
Product Name: ${settings.productName || 'Our Product'}
Description: ${settings.productDescription || 'A helpful tool'}
Target Audience: ${settings.targetAudience || 'General audience'}
Tone: ${settings.tone || 'Friendly and helpful'}

### The Thread (Platform: ${platform})
${threadContent}

### Instructions
1. Read the thread carefully to understand the user's specific pain point.
2. Write a reply that first provides genuine value or empathy regarding their problem.
3. Subtly introduce ${settings.productName || 'our product'} as a potential solution, but DO NOT sound like a spammy ad. It must sound like a genuine recommendation from a ${settings.tone || 'friendly expert'}.
4. If competitors are mentioned (${settings.competitors || 'none specified'}), position our product as a strong alternative without aggressively bashing them.
5. Keep the reply concise and appropriate for the platform (${platform}).
6. Return ONLY the reply text, no extra markdown formatting, quotes, or conversational filler before/after the reply.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || 'Failed to generate a reply draft.';
  } catch (error) {
    console.error('Error generating AI draft:', error);
    // On API error, fall back to template instead of crashing
    return generateTemplateDraft(threadContent, platform, settings);
  }
}
