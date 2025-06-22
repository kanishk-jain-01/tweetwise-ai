// Migration: Add unique constraint to images table and clean up duplicates
// Date: 2025-01-03
// Description: Enforce one-to-one relationship between tweets and images

export const MIGRATION_006_ADD_UNIQUE_CONSTRAINT = `
  -- First, clean up any duplicate images (keep only the most recent one per tweet)
  DELETE FROM images 
  WHERE id NOT IN (
    SELECT DISTINCT ON (tweet_id) id 
    FROM images 
    ORDER BY tweet_id, created_at DESC
  );

  -- Add unique constraint to enforce one-to-one relationship
  ALTER TABLE images ADD CONSTRAINT unique_tweet_image UNIQUE (tweet_id);

  -- Update comment to reflect the constraint
  COMMENT ON TABLE images IS 'AI-generated images associated with tweets (enforced one-to-one relationship)';
  COMMENT ON COLUMN images.tweet_id IS 'Foreign key reference to tweets table (unique constraint - one image per tweet maximum)';
`;

export const MIGRATION_006_ROLLBACK = `
  -- Remove unique constraint
  ALTER TABLE images DROP CONSTRAINT IF EXISTS unique_tweet_image;
  
  -- Revert comments
  COMMENT ON TABLE images IS 'AI-generated images associated with tweets';
  COMMENT ON COLUMN images.tweet_id IS 'Foreign key reference to tweets table';
`;

// Migration metadata
export const MIGRATION_006_METADATA = {
  id: '006',
  name: 'add-unique-constraint-images',
  description: 'Add unique constraint to images table and clean up duplicates',
  date: '2025-01-03',
  up: MIGRATION_006_ADD_UNIQUE_CONSTRAINT,
  down: MIGRATION_006_ROLLBACK,
}; 