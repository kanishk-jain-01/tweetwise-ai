const { neon } = require('@neondatabase/serverless');

// Database URL
const DATABASE_URL = 'postgres://neondb_owner:npg_8Za2orlhAswX@ep-fancy-unit-a4hljrx2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function verifyIndexes() {
  console.log('🔍 Verifying all database indexes...\n');

  try {
    // Get all indexes
    const indexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    console.log(`📋 Found ${indexes.length} indexes:\n`);
    
    // Group by table
    const byTable = {};
    indexes.forEach(idx => {
      if (!byTable[idx.tablename]) {
        byTable[idx.tablename] = [];
      }
      byTable[idx.tablename].push(idx);
    });

    Object.keys(byTable).sort().forEach(tableName => {
      console.log(`🗃️  ${tableName.toUpperCase()} table indexes:`);
      byTable[tableName].forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
      console.log('');
    });

    // Check recommended indexes
    const recommendedIndexes = [
      'idx_tweets_user_updated_at',
      'idx_tweets_content_gin', 
      'idx_users_created_at',
      'idx_ai_responses_tweet_type'
    ];

    console.log('🎯 Checking recommended indexes:');
    recommendedIndexes.forEach(indexName => {
      const found = indexes.find(idx => idx.indexname === indexName);
      if (found) {
        console.log(`   ✅ ${indexName} - Found`);
      } else {
        console.log(`   ❌ ${indexName} - Missing`);
      }
    });

    console.log(`\n📊 Total indexes: ${indexes.length}`);
    console.log('✅ Index verification completed!');

  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    process.exit(1);
  }
}

verifyIndexes(); 