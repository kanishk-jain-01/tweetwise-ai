import openai, { AI_MODELS } from '@/lib/ai/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Per the PRD, a more robust caching solution like Redis should be considered.
// For now, a simple in-memory cache is used for demonstration.
const cache = new Map<string, SpellCheckSuggestion[]>();

const spellCheckSchema = z.object({
  text: z.string().min(1).max(560), // Increased limit to handle longer tweets if needed
});

interface SpellCheckSuggestion {
  original: string;
  suggestion: string;
  startIndex: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = spellCheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { text } = validation.data;

    const cacheKey = `spellcheck:${text}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({
        suggestions: cache.get(cacheKey),
        cached: true,
      });
    }

    const prompt = `You are a spell-checking assistant for social media content. Analyze ONLY for genuine spelling errors.

RULES:
1. ONLY flag words that are clearly misspelled (e.g., "recieve" → "receive", "teh" → "the")
2. DO NOT flag informal language, slang, or intentional abbreviations (e.g., "gonna", "wanna", "ur", "lol")
3. DO NOT flag proper nouns, brand names, or usernames
4. DO NOT flag contractions or different word forms (e.g., "love" vs "loving" are both correct)
5. DO NOT flag words that are contextually appropriate
6. DO NOT flag punctuation, grammar, or capitalization issues
7. Be conservative - when in doubt, don't flag it

EXAMPLES OF WHAT TO FLAG:
- "recieve" → "receive" (common misspelling)
- "seperate" → "separate" (common misspelling)
- "teh" → "the" (obvious typo)

EXAMPLES OF WHAT NOT TO FLAG:
- Informal words: "gonna", "wanna", "ur", "omg", "lol"
- Different tenses: "love" vs "loving" vs "loved"
- Proper nouns: "Twitter", "iPhone", brand names
- Contextually correct words

Respond with a JSON object containing an array of "corrections".
Each object should have: "original" (misspelled word), "suggestion" (correct spelling), "startIndex" (position in text).
If no genuine spelling errors exist, return: { "corrections": [] }

Text to analyze:
"${text}"`;

    const response = await openai.chat.completions.create({
      model: AI_MODELS.SPELL_CHECK,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1, // Slightly increased for more consistent responses
      max_tokens: 500,
      response_format: { type: 'json_object' },
      n: 1,
    });

    const responseContent = response.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    let suggestions: SpellCheckSuggestion[] = [];
    try {
      const result = JSON.parse(responseContent);
      if (result && Array.isArray(result.corrections)) {
        suggestions = result.corrections;
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      // Don't throw here, just return no suggestions
    }

    cache.set(cacheKey, suggestions);

    return NextResponse.json({ suggestions, cached: false });
  } catch (error) {
    console.error('Spell check API error:', error);
    // Per systemPatterns.md, use a consistent error response format
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during spell check.',
        code: 'SPELL_CHECK_ERROR',
      },
      { status: 500 }
    );
  }
}
