// Migration: Add images table for AI-generated tweet images
// Date: 2025-01-03
// Description: Create images table to store AI-generated images with metadata for tweets

export const MIGRATION_005_ADD_IMAGES_TABLE = `
  -- Create images table for storing AI-generated tweet images
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Enforce one-to-one relationship: one image per tweet maximum
    UNIQUE(tweet_id)
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_images_tweet_id ON images(tweet_id);
  CREATE INDEX IF NOT EXISTS idx_images_style ON images(style);
  CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);

  -- Add comments for documentation
  COMMENT ON TABLE images IS 'AI-generated images associated with tweets (one-to-one relationship)';
  COMMENT ON COLUMN images.tweet_id IS 'Foreign key reference to tweets table (unique - one image per tweet)';
  COMMENT ON COLUMN images.base64_data IS 'Base64 encoded image data from OpenAI DALL-E 3';
  COMMENT ON COLUMN images.prompt IS 'Text prompt used to generate the image';
  COMMENT ON COLUMN images.style IS 'Image generation style (ghibli or photo_realistic)';
  COMMENT ON COLUMN images.size IS 'Image dimensions (e.g., 1024x1024, 1536x1024)';
  COMMENT ON COLUMN images.format IS 'Image format returned by OpenAI API';
  COMMENT ON COLUMN images.quality IS 'Image quality setting used for generation';
  COMMENT ON COLUMN images.generation_time_ms IS 'Time taken to generate image in milliseconds';
  COMMENT ON COLUMN images.file_size_bytes IS 'Calculated file size of base64 data in bytes';
`;

export const MIGRATION_005_ROLLBACK = `
  -- Drop indexes first
  DROP INDEX IF EXISTS idx_images_created_at;
  DROP INDEX IF EXISTS idx_images_style;
  DROP INDEX IF EXISTS idx_images_tweet_id;
  
  -- Drop the images table
  DROP TABLE IF EXISTS images;
`;

// Migration metadata
export const MIGRATION_005_METADATA = {
  id: '005',
  name: 'add-images-table',
  description: 'Create images table for AI-generated tweet images with metadata',
  date: '2025-01-03',
  up: MIGRATION_005_ADD_IMAGES_TABLE,
  down: MIGRATION_005_ROLLBACK,
}; 