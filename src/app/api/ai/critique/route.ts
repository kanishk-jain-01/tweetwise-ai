import openai, { AI_MODELS } from '@/lib/ai/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// In-memory cache for critique results
const cache = new Map<string, TweetCritique>();

const critiqueSchema = z.object({
  content: z.string().min(1).max(560),
});

interface TweetCritique {
  engagementScore: number;
  clarity: number;
  tone: string;
  suggestions: string[];
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = critiqueSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    const cacheKey = `critique:${content}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({
        critique: cache.get(cacheKey),
        cached: true,
      });
    }

    const prompt = `You are an expert social media analyst specializing in Twitter engagement optimization. Analyze the following tweet for engagement potential, clarity, tone, and provide actionable improvement suggestions.

ANALYSIS CRITERIA:

1. ENGAGEMENT SCORE (1-10):
   - Consider factors like: hooks, curiosity gaps, emotional triggers, call-to-action, controversy (appropriate), relatability
   - Higher scores for tweets that spark conversations, encourage replies, or prompt shares
   - Consider Twitter-specific engagement tactics (threads, questions, polls, etc.)

2. CLARITY SCORE (1-10):
   - How easily can the average reader understand the message?
   - Is the main point clear and concise?
   - Does the tweet avoid ambiguity or confusion?

3. TONE ANALYSIS:
   - Identify the primary tone (e.g., "Professional", "Casual", "Humorous", "Inspirational", "Controversial", "Educational", "Personal")
   - Consider if the tone matches typical high-engagement Twitter content

4. IMPROVEMENT SUGGESTIONS:
   - Provide 2-4 specific, actionable suggestions to increase engagement
   - Focus on Twitter-specific tactics like:
     * Adding hooks or opening lines
     * Using questions to encourage replies
     * Including calls-to-action
     * Improving emotional appeal
     * Adding personality or personal touch
     * Using Twitter-native features (threads, polls, etc.)
     * Timing and context considerations
   - Avoid generic advice; be specific to the content

IMPORTANT GUIDELINES:
- Be constructive and encouraging
- Focus on engagement optimization, not just grammar/spelling
- Consider Twitter's unique culture and best practices
- Provide actionable, specific suggestions
- Keep suggestions concise but valuable

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object, no other text.

{
  "engagementScore": [number 1-10],
  "clarity": [number 1-10], 
  "tone": "[primary tone description]",
  "suggestions": [
    "Specific actionable suggestion 1",
    "Specific actionable suggestion 2",
    "Specific actionable suggestion 3"
  ]
}

Tweet to analyze:
"${content}"`;

    const response = await openai.chat.completions.create({
      model: AI_MODELS.CRITIQUE,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Slightly higher for more creative suggestions
      max_tokens: 800,
      n: 1,
    });

    const responseContent = response.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    let critique: TweetCritique;
    try {
      const result = JSON.parse(responseContent);

      // Validate the response structure
      if (
        !result ||
        typeof result.engagementScore !== 'number' ||
        typeof result.clarity !== 'number' ||
        typeof result.tone !== 'string' ||
        !Array.isArray(result.suggestions)
      ) {
        throw new Error('Invalid response structure from AI');
      }

      // Ensure scores are within valid range
      const engagementScore = Math.max(
        1,
        Math.min(10, Math.round(result.engagementScore))
      );
      const clarity = Math.max(1, Math.min(10, Math.round(result.clarity)));

      critique = {
        engagementScore,
        clarity,
        tone: result.tone,
        suggestions: result.suggestions.slice(0, 4), // Limit to 4 suggestions max
      };
    } catch (e) {
      console.error('Failed to parse OpenAI critique response:', e);
      console.error('Response content:', responseContent);

      // Provide fallback critique
      critique = {
        engagementScore: 5,
        clarity: 5,
        tone: 'Neutral',
        suggestions: [
          'Unable to analyze tweet at this time. Please try again.',
        ],
      };
    }

    // Cache the result
    cache.set(cacheKey, critique);

    return NextResponse.json({
      critique,
      cached: false,
    });
  } catch (error) {
    console.error('Tweet critique API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during tweet analysis.',
        code: 'CRITIQUE_ERROR',
      },
      { status: 500 }
    );
  }
}
