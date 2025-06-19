// Basic types for TweetWiseAI
// This file establishes the types folder structure

export interface User {
  id: string;
  email: string;
}

export interface Tweet {
  id: string;
  content: string;
  status: 'draft' | 'completed';
}

// More types will be added as needed during development 