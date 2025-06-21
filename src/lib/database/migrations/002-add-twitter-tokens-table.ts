// Migration: Add Twitter tokens table for OAuth token storage
// Date: 2025-01-03
// Description: Creates twitter_tokens table for storing Twitter OAuth tokens and user information

export const MIGRATION_002_ADD_TWITTER_TOKENS_TABLE = `
  -- Create twitter_tokens table for OAuth token storage
  CREATE TABLE twitter_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    twitter_user_id TEXT NOT NULL,
    twitter_username TEXT NOT NULL,
    twitter_name TEXT NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
  );
  
  -- Create indexes for efficient queries
  CREATE INDEX idx_twitter_tokens_user_id ON twitter_tokens(user_id);
  CREATE INDEX idx_twitter_tokens_twitter_user_id ON twitter_tokens(twitter_user_id);
  
  -- Add trigger for automatic updated_at timestamp
  CREATE TRIGGER update_twitter_tokens_updated_at
    BEFORE UPDATE ON twitter_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Add comments to document the table
  COMMENT ON TABLE twitter_tokens IS 'Stores Twitter OAuth tokens and user information';
  COMMENT ON COLUMN twitter_tokens.access_token IS 'Twitter OAuth access token for API requests';
  COMMENT ON COLUMN twitter_tokens.refresh_token IS 'Twitter OAuth refresh token for token renewal';
  COMMENT ON COLUMN twitter_tokens.twitter_user_id IS 'Twitter user ID from Twitter API';
  COMMENT ON COLUMN twitter_tokens.twitter_username IS 'Twitter username (handle) from Twitter API';
  COMMENT ON COLUMN twitter_tokens.twitter_name IS 'Twitter display name from Twitter API';
`;

export const MIGRATION_002_ROLLBACK = `
  -- Rollback: Remove twitter_tokens table
  DROP TRIGGER IF EXISTS update_twitter_tokens_updated_at ON twitter_tokens;
  DROP TABLE IF EXISTS twitter_tokens CASCADE;
`;

// Migration metadata
export const MIGRATION_002_METADATA = {
  id: '002',
  name: 'add-twitter-tokens-table',
  description: 'Create twitter_tokens table for storing Twitter OAuth tokens',
  date: '2025-01-03',
  up: MIGRATION_002_ADD_TWITTER_TOKENS_TABLE,
  down: MIGRATION_002_ROLLBACK,
};
