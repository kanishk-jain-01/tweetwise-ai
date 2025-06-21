// Migration: Fix Twitter refresh token constraint
// Date: 2025-01-03
// Description: Make refresh_token nullable since Twitter API doesn't always return refresh tokens

export const MIGRATION_004_FIX_TWITTER_REFRESH_TOKEN = `
  -- Make refresh_token nullable in twitter_tokens table
  ALTER TABLE twitter_tokens 
  ALTER COLUMN refresh_token DROP NOT NULL;
  
  -- Update comment to reflect the change
  COMMENT ON COLUMN twitter_tokens.refresh_token IS 'Twitter OAuth refresh token for token renewal (nullable - not always provided by Twitter API)';
`;

export const MIGRATION_004_ROLLBACK = `
  -- Rollback: Make refresh_token NOT NULL again (this might fail if there are null values)
  UPDATE twitter_tokens SET refresh_token = '' WHERE refresh_token IS NULL;
  ALTER TABLE twitter_tokens 
  ALTER COLUMN refresh_token SET NOT NULL;
  
  -- Restore original comment
  COMMENT ON COLUMN twitter_tokens.refresh_token IS 'Twitter OAuth refresh token for token renewal';
`;

// Migration metadata
export const MIGRATION_004_METADATA = {
  id: '004',
  name: 'fix-twitter-refresh-token',
  description: 'Make refresh_token nullable in twitter_tokens table',
  date: '2025-01-03',
  up: MIGRATION_004_FIX_TWITTER_REFRESH_TOKEN,
  down: MIGRATION_004_ROLLBACK,
}; 