import { sql } from './index';
import { MIGRATION_001_METADATA } from './migrations/001-add-twitter-fields';
import { MIGRATION_002_METADATA } from './migrations/002-add-twitter-tokens-table';
import { MIGRATION_003_METADATA } from './migrations/003-add-twitter-user-fields';

// All available migrations in order
const MIGRATIONS = [
  MIGRATION_001_METADATA,
  MIGRATION_002_METADATA,
  MIGRATION_003_METADATA,
];

// Run specific migration
async function runMigration(
  migration: typeof MIGRATION_001_METADATA
): Promise<void> {
  console.log(`   Running migration ${migration.id}: ${migration.name}...`);
  await sql.unsafe(migration.up);
  console.log(`   ✅ Migration ${migration.id} completed`);
}

// Run all migrations to set up the database schema
export async function runMigrations(): Promise<void> {
  console.log('🔧 Running database migrations...');

  try {
    // Create users table
    console.log('   Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) NULL,
        reset_token_expiry TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create tweets table
    console.log('   Creating tweets table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tweets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'completed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create ai_responses table
    console.log('   Creating ai_responses table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ai_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('spelling', 'grammar', 'critique', 'curation')),
        request_hash VARCHAR(255) UNIQUE NOT NULL,
        response_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes
    console.log('   Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tweets_user_status ON tweets(user_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_responses_hash ON ai_responses(request_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_responses_tweet_id ON ai_responses(tweet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_responses_type ON ai_responses(type)`;

    // Create updated_at trigger function
    console.log('   Creating trigger function...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create triggers
    console.log('   Creating triggers...');
    await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`;
    await sql`
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_tweets_updated_at ON tweets`;
    await sql`
      CREATE TRIGGER update_tweets_updated_at
        BEFORE UPDATE ON tweets
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    // Run all available migrations
    for (const migration of MIGRATIONS) {
      await runMigration(migration);
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Check if tables exist
export async function checkTablesExist(): Promise<{
  users: boolean;
  tweets: boolean;
  ai_responses: boolean;
}> {
  try {
    const result = await sql`
      SELECT 
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as users_exists,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tweets') as tweets_exists,
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_responses') as ai_responses_exists
    `;

    return {
      users: result[0]?.users_exists || false,
      tweets: result[0]?.tweets_exists || false,
      ai_responses: result[0]?.ai_responses_exists || false,
    };
  } catch (error) {
    console.error('Failed to check table existence:', error);
    throw error;
  }
}

// Get table information including column details
export async function getTableInfo(tableName: string) {
  try {
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;

    const indexes = await sql`
      SELECT 
        indexname as index_name,
        indexdef as index_definition
      FROM pg_indexes
      WHERE tablename = ${tableName}
      AND schemaname = 'public'
    `;

    return {
      tableName,
      columns,
      indexes,
    };
  } catch (error) {
    console.error(`Failed to get table info for ${tableName}:`, error);
    throw error;
  }
}

// Verify schema integrity
export async function verifySchema(): Promise<boolean> {
  try {
    console.log('🔍 Verifying database schema...');

    const tablesExist = await checkTablesExist();

    if (
      !tablesExist.users ||
      !tablesExist.tweets ||
      !tablesExist.ai_responses
    ) {
      console.log('❌ Some tables are missing');
      return false;
    }

    // Check if users table has required columns
    const usersInfo = await getTableInfo('users');
    const requiredUserColumns = [
      'id',
      'email',
      'password_hash',
      'created_at',
      'updated_at',
    ];
    const userColumns = usersInfo.columns.map(col => col.column_name);

    for (const requiredCol of requiredUserColumns) {
      if (!userColumns.includes(requiredCol)) {
        console.log(`❌ Users table missing required column: ${requiredCol}`);
        return false;
      }
    }

    console.log('✅ Schema verification passed');
    return true;
  } catch (error) {
    console.error('Schema verification failed:', error);
    return false;
  }
}

// Initialize database (run migrations if needed)
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing database...');

    const isValid = await verifySchema();

    if (!isValid) {
      console.log('📦 Schema invalid or missing, running migrations...');
      await runMigrations();

      // Verify again after migrations
      const isValidAfter = await verifySchema();
      if (!isValidAfter) {
        throw new Error(
          'Schema verification failed even after running migrations'
        );
      }
    } else {
      console.log('✅ Database schema is already up to date');
    }

    console.log('🎉 Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
