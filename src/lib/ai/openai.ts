import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // The OpenAI SDK automatically handles retries on transient errors,
  // which helps with rate limiting. We can configure maxRetries for more control.
  maxRetries: 2,
});

export const AI_MODELS = {
  SPELL_CHECK: 'gpt-3.5-turbo',
  GRAMMAR_CHECK: 'gpt-4',
  CRITIQUE: 'gpt-4',
  CURATION: 'gpt-4',
};

export default openai;
