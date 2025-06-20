// Migration: Add Twitter user info fields to users table
// Date: 2025-01-03
// Description: Adds fields for storing Twitter user information in the users table for API integration

export const MIGRATION_003_ADD_TWITTER_USER_FIELDS = `
  -- Add Twitter user information fields to users table
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS twitter_user_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS twitter_username VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS twitter_name VARCHAR(255) NULL;

  -- Add indexes for Twitter user queries
  CREATE INDEX IF NOT EXISTS idx_users_twitter_user_id ON users(twitter_user_id) 
    WHERE twitter_user_id IS NOT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_users_twitter_username ON users(twitter_username) 
    WHERE twitter_username IS NOT NULL;

  -- Add comments to track field purposes
  COMMENT ON COLUMN users.twitter_user_id IS 'Twitter user ID from Twitter API';
  COMMENT ON COLUMN users.twitter_username IS 'Twitter username (handle without @)';
  COMMENT ON COLUMN users.twitter_name IS 'Twitter display name';
`;

export const MIGRATION_003_ROLLBACK = `
  -- Rollback: Remove Twitter user info fields
  ALTER TABLE users 
  DROP COLUMN IF EXISTS twitter_user_id,
  DROP COLUMN IF EXISTS twitter_username,
  DROP COLUMN IF EXISTS twitter_name;

  -- Drop indexes
  DROP INDEX IF EXISTS idx_users_twitter_user_id;
  DROP INDEX IF EXISTS idx_users_twitter_username;
`;

// Migration metadata
export const MIGRATION_003_METADATA = {
  id: '003',
  name: 'add-twitter-user-fields',
  description: 'Add Twitter user information fields to users table',
  date: '2025-01-03',
  up: MIGRATION_003_ADD_TWITTER_USER_FIELDS,
  down: MIGRATION_003_ROLLBACK,
};
