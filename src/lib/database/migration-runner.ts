// Database Migration Runner
// Utility to safely execute database migrations

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { MIGRATION_001_METADATA } from './migrations/001-add-twitter-fields';

// Load environment variables
config({ path: '.env.local' });

// Get database connection
const sql = neon(process.env.DATABASE_URL!);

// Available migrations in order
const MIGRATIONS = [MIGRATION_001_METADATA];

// Migration tracking table
const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(255)
  );
`;

// Create a simple checksum for migration content
function createChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Check if migration has been applied
async function isMigrationApplied(migrationId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM schema_migrations WHERE id = ${migrationId}
    `;
    return result.length > 0;
  } catch {
    // If table doesn't exist, migration hasn't been applied
    return false;
  }
}

// Record migration as applied
async function recordMigration(
  migration: typeof MIGRATION_001_METADATA
): Promise<void> {
  const checksum = createChecksum(migration.up);

  await sql`
    INSERT INTO schema_migrations (id, name, description, checksum)
    VALUES (${migration.id}, ${migration.name}, ${migration.description}, ${checksum})
  `;
}

// Execute a single migration
async function executeMigration(
  migration: typeof MIGRATION_001_METADATA
): Promise<void> {
  console.log(`Applying migration ${migration.id}: ${migration.name}`);

  try {
    // Execute the migration SQL - run statements directly
    const statements = migration.up
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  Executing: ${statement.substring(0, 50)}...`);
        const result = await sql.query(statement);
        console.log(`  ✅ Executed successfully`);
      }
    }

    // Record successful migration
    await recordMigration(migration);
    console.log(`✅ Migration ${migration.id} applied successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migration.id} failed:`, error);
    throw error;
  }
}

// Run all pending migrations
export async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...');

  try {
    // Ensure migrations table exists
    await sql.query(CREATE_MIGRATIONS_TABLE);

    let appliedCount = 0;

    for (const migration of MIGRATIONS) {
      if (await isMigrationApplied(migration.id)) {
        console.log(`⏭️  Migration ${migration.id} already applied, skipping`);
        continue;
      }

      await executeMigration(migration);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date, no migrations needed');
    } else {
      console.log(`✅ Applied ${appliedCount} migration(s) successfully`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Get migration status
export async function getMigrationStatus(): Promise<
  Array<{
    id: string;
    name: string;
    applied: boolean;
    appliedAt?: Date;
  }>
> {
  try {
    // Ensure migrations table exists
    await sql.query(CREATE_MIGRATIONS_TABLE);

    const appliedMigrations = await sql`
      SELECT id, applied_at FROM schema_migrations ORDER BY id
    `;

    const appliedMap = new Map(
      appliedMigrations.map(m => [m.id, m.applied_at])
    );

    return MIGRATIONS.map(migration => ({
      id: migration.id,
      name: migration.name,
      applied: appliedMap.has(migration.id),
      appliedAt: appliedMap.get(migration.id) || undefined,
    }));
  } catch (error) {
    console.error('Error getting migration status:', error);
    throw error;
  }
}

// Rollback a specific migration (use with caution)
export async function rollbackMigration(migrationId: string): Promise<void> {
  const migration = MIGRATIONS.find(m => m.id === migrationId);
  if (!migration) {
    throw new Error(`Migration ${migrationId} not found`);
  }

  if (!(await isMigrationApplied(migrationId))) {
    throw new Error(`Migration ${migrationId} is not applied`);
  }

  console.log(`Rolling back migration ${migrationId}: ${migration.name}`);

  try {
    // Execute rollback SQL
    const statements = migration.down
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  Rolling back: ${statement.substring(0, 50)}...`);
        const result = await sql.query(statement);
        console.log(`  ✅ Rolled back successfully`);
      }
    }

    // Remove from migrations table
    await sql`DELETE FROM schema_migrations WHERE id = ${migrationId}`;

    console.log(`✅ Migration ${migrationId} rolled back successfully`);
  } catch (error) {
    console.error(`❌ Rollback of migration ${migrationId} failed:`, error);
    throw error;
  }
}
