import openai, { AI_MODELS } from '@/lib/ai/openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// In-memory cache for writing check results
const cache = new Map<string, WritingCheckSuggestion[]>();

const writingCheckSchema = z.object({
  text: z.string().min(1).max(560),
});

interface WritingCheckSuggestion {
  original: string;
  suggestion: string;
  startIndex: number;
  type: 'spelling' | 'grammar';
  explanation: string;
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

    const validation = writingCheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { text } = validation.data;

    const cacheKey = `writing:${text}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({
        suggestions: cache.get(cacheKey),
        cached: true,
      });
    }

    const prompt = `You are a comprehensive writing assistant for social media content. Analyze the text for BOTH spelling errors and grammar issues. Be conservative and focus on genuine errors that would improve clarity and professionalism.

SPELLING RULES:
1. ONLY flag words that are clearly misspelled (e.g., "recieve" → "receive", "teh" → "the")
2. DO NOT flag informal language, slang, or intentional abbreviations (e.g., "gonna", "wanna", "ur", "lol")
3. DO NOT flag proper nouns, brand names, or usernames
4. DO NOT flag contractions or different word forms (e.g., "love" vs "loving" are both correct)
5. DO NOT flag words that are contextually appropriate

GRAMMAR RULES:
1. ONLY flag clear grammatical errors (e.g., subject-verb disagreement, incorrect tense, missing articles)
2. DO NOT flag informal language, slang, or social media conventions (e.g., "gonna", "wanna", "ur")
3. DO NOT flag sentence fragments if they're intentional for impact
4. DO NOT flag contractions or casual tone
5. DO NOT flag punctuation or capitalization unless it severely impacts meaning
6. Focus on clarity and readability improvements

EXAMPLES OF SPELLING ISSUES TO FLAG:
- "recieve" → "receive" (common misspelling)
- "seperate" → "separate" (common misspelling)
- "teh" → "the" (obvious typo)

EXAMPLES OF GRAMMAR ISSUES TO FLAG:
- "I seen that movie" → "I saw that movie" (incorrect verb form)
- "Me and John went" → "John and I went" (incorrect pronoun case)
- "There's many reasons" → "There are many reasons" (subject-verb disagreement)
- "It's to late" → "It's too late" (wrong word usage)

EXAMPLES OF WHAT NOT TO FLAG:
- Informal contractions: "don't", "won't", "it's"
- Casual language: "gonna", "wanna", "kinda"
- Sentence fragments for emphasis: "So good.", "Amazing!"
- Social media conventions: hashtags, mentions, emojis

For each issue found, provide a brief explanation and categorize it as either "spelling" or "grammar".

IMPORTANT: You must respond with ONLY a valid JSON object, no other text.
Respond with a JSON object containing an array of "corrections".
Each object should have: "original" (incorrect text), "suggestion" (correct text), "startIndex" (position in text), "type" (either "spelling" or "grammar"), "explanation" (brief reason for change).
If no errors exist, return: { "corrections": [] }

Text to analyze:
"${text}"`;

    const response = await openai.chat.completions.create({
      model: AI_MODELS.GRAMMAR_CHECK, // Using GPT-4 for both spelling and grammar
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
      n: 1,
    });

    const responseContent = response.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    let suggestions: WritingCheckSuggestion[] = [];
    try {
      const result = JSON.parse(responseContent);
      if (result && Array.isArray(result.corrections)) {
        suggestions = result.corrections;
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      console.error('Response content:', responseContent);
      // Don't throw here, just return no suggestions
    }

    cache.set(cacheKey, suggestions);

    return NextResponse.json({ suggestions, cached: false });
  } catch (error) {
    console.error('Writing check API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during writing check.',
        code: 'WRITING_CHECK_ERROR',
      },
      { status: 500 }
    );
  }
}
