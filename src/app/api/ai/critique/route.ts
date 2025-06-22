import openai, { AI_MODELS } from '@/lib/ai/openai';
import { authOptions } from '@/lib/auth/auth';
import { AIResponseQueries } from '@/lib/database/ai-queries';
import { TweetQueries, UserQueries } from '@/lib/database/queries';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// In-memory cache for critique results (secondary performance layer)
const cache = new Map<string, TweetCritiqueWithMetadata>();

const critiqueSchema = z.object({
  content: z.string().min(1).max(560),
  tweetId: z.string().uuid().optional(), // Optional for backward compatibility
  forceRefresh: z.boolean().optional(), // Optional flag to bypass cache and generate fresh analysis
});

interface TweetCritique {
  engagementScore: number;
  clarity: number;
  tone: string;
  suggestions: string[];
}

interface TweetCritiqueWithMetadata extends TweetCritique {
  id?: string;
  created_at?: Date;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    const { content, tweetId, forceRefresh } = validation.data;

    // If tweetId is provided, verify user owns the tweet
    if (tweetId) {
      const user = await UserQueries.findByEmail(session.user.email);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const hasOwnership = await TweetQueries.verifyOwnership(tweetId, user.id);
      if (!hasOwnership) {
        return NextResponse.json(
          { error: 'Tweet not found or access denied' },
          { status: 403 }
        );
      }
    }

    // If tweetId is provided and not forcing refresh, check database first for existing analysis
    if (tweetId && !forceRefresh) {
      try {
        const existingAnalysis = await AIResponseQueries.getAnalysis(tweetId, 'critique');
        if (existingAnalysis) {
          const critique = existingAnalysis.response_data as TweetCritique;
          const critiqueWithMetadata: TweetCritiqueWithMetadata = {
            ...critique,
            id: existingAnalysis.id,
            created_at: existingAnalysis.created_at,
          };

          // Also cache in memory for performance
          const cacheKey = `critique:${tweetId}:${content}`;
          cache.set(cacheKey, critiqueWithMetadata);

          return NextResponse.json({
            critique: critiqueWithMetadata,
            cached: true,
            source: 'database',
          });
        }
      } catch (error) {
        console.error('Error retrieving existing analysis from database:', error);
        // Continue with new analysis generation
      }
    }

    // Check in-memory cache as fallback (skip if forcing refresh)
    const cacheKey = tweetId ? `critique:${tweetId}:${content}` : `critique:${content}`;
    if (!forceRefresh && cache.has(cacheKey)) {
      return NextResponse.json({
        critique: cache.get(cacheKey),
        cached: true,
        source: 'memory',
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

    // Save to database if tweetId is provided
    let critiqueWithMetadata: TweetCritiqueWithMetadata = critique;
    
    if (tweetId) {
      try {
        const savedAnalysis = await AIResponseQueries.saveAnalysis(tweetId, 'critique', critique);
        critiqueWithMetadata = {
          ...critique,
          id: savedAnalysis.id,
          created_at: savedAnalysis.created_at,
        };
      } catch (error) {
        console.error('Error saving analysis to database:', error);
        // Continue with in-memory cache only
      }
    }

    // Cache the result in memory for performance
    cache.set(cacheKey, critiqueWithMetadata);

    return NextResponse.json({
      critique: critiqueWithMetadata,
      cached: false,
      source: 'generated',
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
