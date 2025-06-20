import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Please add it to your .env.local file.'
  );
}

// Create the main database client
export const sql = neon(process.env.DATABASE_URL);

// Database connection test utility
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Get database info utility
export async function getDatabaseInfo() {
  try {
    const result = await sql`
      SELECT 
        NOW() as current_time,
        version() as postgres_version,
        current_database() as database_name
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to get database info:', error);
    throw error;
  }
}

// List all tables utility
export async function listTables() {
  try {
    const tables = await sql`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    return tables;
  } catch (error) {
    console.error('Failed to list tables:', error);
    throw error;
  }
}

// Check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    return result[0].exists;
  } catch (error) {
    console.error(`Failed to check if table ${tableName} exists:`, error);
    return false;
  }
}

export default sql; 