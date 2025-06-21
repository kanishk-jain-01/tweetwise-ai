// Basic types for TweetWiseAI
// This file establishes the types folder structure

export interface User {
  id: string;
  email: string;
}

export interface Tweet {
  id: string;
  content: string;
  status: 'draft' | 'completed' | 'scheduled' | 'sent';
  scheduled_for?: Date | null;
  tweet_id?: string | null;
  sent_at?: Date | null;
  error_message?: string | null;
}

// More types will be added as needed during development
