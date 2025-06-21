// Migration: Add Twitter-related fields to tweets table
// Date: 2025-01-03
// Description: Adds fields for Twitter integration including scheduling, tweet IDs, and error tracking

export const MIGRATION_001_ADD_TWITTER_FIELDS = `
  -- Add new Twitter-related fields to tweets table
  ALTER TABLE tweets 
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS tweet_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS error_message TEXT NULL;

  -- Update status constraint to include new values
  ALTER TABLE tweets DROP CONSTRAINT IF EXISTS tweets_status_check;
  ALTER TABLE tweets ADD CONSTRAINT tweets_status_check 
    CHECK (status IN ('draft', 'completed', 'scheduled', 'sent'));

  -- Add indexes for new fields to optimize queries
  CREATE INDEX IF NOT EXISTS idx_tweets_scheduled_for ON tweets(scheduled_for) 
    WHERE scheduled_for IS NOT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_tweets_tweet_id ON tweets(tweet_id) 
    WHERE tweet_id IS NOT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_tweets_status_scheduled ON tweets(status, scheduled_for) 
    WHERE status = 'scheduled';

  -- Add comment to track migration
  COMMENT ON COLUMN tweets.scheduled_for IS 'When the tweet is scheduled to be posted (NULL for immediate posts)';
  COMMENT ON COLUMN tweets.tweet_id IS 'Twitter API tweet ID after successful posting';
  COMMENT ON COLUMN tweets.sent_at IS 'Timestamp when tweet was successfully posted to Twitter';
  COMMENT ON COLUMN tweets.error_message IS 'Error message if tweet posting failed';
`;

export const MIGRATION_001_ROLLBACK = `
  -- Rollback: Remove Twitter-related fields
  ALTER TABLE tweets 
  DROP COLUMN IF EXISTS scheduled_for,
  DROP COLUMN IF EXISTS tweet_id,
  DROP COLUMN IF EXISTS sent_at,
  DROP COLUMN IF EXISTS error_message;

  -- Restore original status constraint
  ALTER TABLE tweets DROP CONSTRAINT IF EXISTS tweets_status_check;
  ALTER TABLE tweets ADD CONSTRAINT tweets_status_check 
    CHECK (status IN ('draft', 'completed'));

  -- Drop indexes
  DROP INDEX IF EXISTS idx_tweets_scheduled_for;
  DROP INDEX IF EXISTS idx_tweets_tweet_id;
  DROP INDEX IF EXISTS idx_tweets_status_scheduled;
`;

// Migration metadata
export const MIGRATION_001_METADATA = {
  id: '001',
  name: 'add-twitter-fields',
  description: 'Add Twitter integration fields to tweets table',
  date: '2025-01-03',
  up: MIGRATION_001_ADD_TWITTER_FIELDS,
  down: MIGRATION_001_ROLLBACK,
};
