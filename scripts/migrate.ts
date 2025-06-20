#!/usr/bin/env tsx
// Database Migration CLI
// Usage: npm run migrate [command]
// Commands: up, status, rollback [migration-id]

import { config } from 'dotenv';
import {
  getMigrationStatus,
  rollbackMigration,
  runMigrations,
} from '../src/lib/database/migration-runner';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function main() {
  const command = process.argv[2] || 'up';

  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;

      case 'status':
        const status = await getMigrationStatus();
        console.log('\n📊 Migration Status:');
        console.log('===================');

        if (status.length === 0) {
          console.log('No migrations found');
        } else {
          status.forEach(migration => {
            const statusIcon = migration.applied ? '✅' : '⏸️ ';
            const appliedAt = migration.appliedAt
              ? ` (applied: ${migration.appliedAt.toISOString()})`
              : '';
            console.log(
              `${statusIcon} ${migration.id}: ${migration.name}${appliedAt}`
            );
          });
        }
        break;

      case 'rollback':
        const migrationId = process.argv[3];
        if (!migrationId) {
          console.error('❌ Migration ID required for rollback');
          console.log('Usage: npm run migrate rollback <migration-id>');
          process.exit(1);
        }

        console.log(`⚠️  WARNING: Rolling back migration ${migrationId}`);
        console.log('This action cannot be undone!');

        // In a real app, you might want to add a confirmation prompt here
        await rollbackMigration(migrationId);
        break;

      default:
        console.log('Available commands:');
        console.log('  up       - Run all pending migrations');
        console.log('  status   - Show migration status');
        console.log('  rollback - Rollback a specific migration');
        break;
    }
  } catch (error) {
    console.error('❌ Migration command failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

main();
