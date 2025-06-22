// Database schema definitions for TweetWiseAI

export interface User {
  id: string;
  email: string;
  password_hash: string;
  reset_token?: string | null;
  reset_token_expiry?: Date | null;
  twitter_user_id?: string | null;
  twitter_username?: string | null;
  twitter_name?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Tweet {
  id: string;
  user_id: string;
  content: string;
  status: 'draft' | 'completed' | 'scheduled' | 'sent';
  scheduled_for?: Date | null;
  tweet_id?: string | null;
  sent_at?: Date | null;
  error_message?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Extended Tweet interface with image relationship
export interface TweetWithImage extends Tweet {
  image?: Image | null;
}

export interface AIResponse {
  id: string;
  tweet_id: string;
  type: 'spelling' | 'grammar' | 'critique' | 'curation';
  request_hash: string;
  response_data: Record<string, any>;
  created_at: Date;
}

export interface Image {
  id: string;
  tweet_id: string;
  base64_data: string;
  prompt: string;
  style: 'ghibli' | 'photo_realistic';
  size: string;
  format: 'png' | 'jpeg' | 'webp';
  quality: 'high' | 'medium' | 'low';
  generation_time_ms?: number | null;
  file_size_bytes?: number | null;
  created_at: Date;
}

// Image-related enums and utility types
export type ImageStyle = 'ghibli' | 'photo_realistic';
export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type ImageQuality = 'high' | 'medium' | 'low';

// Image generation request interface
export interface ImageGenerationRequest {
  prompt: string;
  style: ImageStyle;
  size?: string;
  format?: ImageFormat;
  quality?: ImageQuality;
}

// Image creation interface (for database operations)
export interface CreateImageData {
  tweet_id: string;
  base64_data: string;
  prompt: string;
  style: ImageStyle;
  size: string;
  format: ImageFormat;
  quality: ImageQuality;
  generation_time_ms?: number;
  file_size_bytes?: number;
}

// Image update interface (for partial updates)
export interface UpdateImageData {
  base64_data?: string;
  prompt?: string;
  style?: ImageStyle;
  size?: string;
  format?: ImageFormat;
  quality?: ImageQuality;
  generation_time_ms?: number;
  file_size_bytes?: number;
}

// SQL schema for creating tables
export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

export const CREATE_TWEETS_TABLE = `
  CREATE TABLE IF NOT EXISTS tweets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'completed', 'scheduled', 'sent')),
    scheduled_for TIMESTAMP WITH TIME ZONE NULL,
    tweet_id VARCHAR(255) NULL,
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

export const CREATE_AI_RESPONSES_TABLE = `
  CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('spelling', 'grammar', 'critique', 'curation')),
    request_hash VARCHAR(255) UNIQUE NOT NULL,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

export const CREATE_IMAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    base64_data TEXT NOT NULL,
    prompt TEXT NOT NULL,
    style VARCHAR(20) NOT NULL CHECK (style IN ('ghibli', 'photo_realistic')),
    size VARCHAR(20) NOT NULL,
    format VARCHAR(10) NOT NULL CHECK (format IN ('png', 'jpeg', 'webp')),
    quality VARCHAR(10) NOT NULL CHECK (quality IN ('high', 'medium', 'low')),
    generation_time_ms INTEGER NULL,
    file_size_bytes INTEGER NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

// Indexes for performance
export const CREATE_INDEXES = `
  -- User email index (already unique, but explicit for queries)
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  
  -- Tweet queries by user
  CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id);
  CREATE INDEX IF NOT EXISTS idx_tweets_user_status ON tweets(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC);
  
  -- Twitter integration indexes
  CREATE INDEX IF NOT EXISTS idx_tweets_scheduled_for ON tweets(scheduled_for) 
    WHERE scheduled_for IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_tweets_tweet_id ON tweets(tweet_id) 
    WHERE tweet_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_tweets_status_scheduled ON tweets(status, scheduled_for) 
    WHERE status = 'scheduled';
  
  -- AI response caching
  CREATE INDEX IF NOT EXISTS idx_ai_responses_hash ON ai_responses(request_hash);
  CREATE INDEX IF NOT EXISTS idx_ai_responses_tweet_id ON ai_responses(tweet_id);
  CREATE INDEX IF NOT EXISTS idx_ai_responses_type ON ai_responses(type);
  
  -- Image queries
  CREATE INDEX IF NOT EXISTS idx_images_tweet_id ON images(tweet_id);
  CREATE INDEX IF NOT EXISTS idx_images_style ON images(style);
  CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
`;

// Trigger for updating updated_at timestamp
export const CREATE_UPDATED_AT_TRIGGER = `
  -- Function to update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Triggers for users table
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Triggers for tweets table
  DROP TRIGGER IF EXISTS update_tweets_updated_at ON tweets;
  CREATE TRIGGER update_tweets_updated_at
    BEFORE UPDATE ON tweets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

// All schema creation in order
export const SCHEMA_CREATION_ORDER = [
  CREATE_USERS_TABLE,
  CREATE_TWEETS_TABLE,
  CREATE_AI_RESPONSES_TABLE,
  CREATE_IMAGES_TABLE,
  CREATE_INDEXES,
  CREATE_UPDATED_AT_TRIGGER,
];
