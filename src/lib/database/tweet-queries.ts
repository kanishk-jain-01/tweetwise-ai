import { sql } from './index';
import type { Tweet } from './schema';

// Tweet Query Functions
export class TweetQueries {
  // Create new tweet
  static async create(tweetData: {
    user_id: string;
    content: string;
    status: 'draft' | 'completed';
  }): Promise<Tweet> {
    try {
      const tweets = await sql`
        INSERT INTO tweets (user_id, content, status, created_at, updated_at)
        VALUES (${tweetData.user_id}, ${tweetData.content}, ${tweetData.status}, NOW(), NOW())
        RETURNING id, user_id, content, status, created_at, updated_at
      `;
      
      if (tweets.length === 0) {
        throw new Error('Failed to create tweet');
      }
      
      return tweets[0] as Tweet;
    } catch (error) {
      console.error('Error creating tweet:', error);
      throw error;
    }
  }

  // Find tweet by ID
  static async findById(id: string): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, created_at, updated_at
        FROM tweets 
        WHERE id = ${id}
        LIMIT 1
      `;
      
      return tweets.length > 0 ? tweets[0] as Tweet : null;
    } catch (error) {
      console.error('Error finding tweet by ID:', error);
      throw error;
    }
  }

  // Find all tweets by user ID
  static async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return tweets as Tweet[];
    } catch (error) {
      console.error('Error finding tweets by user ID:', error);
      throw error;
    }
  }

  // Find drafts by user ID
  static async findDraftsByUserId(userId: string, limit: number = 50): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} AND status = 'draft'
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
      
      return tweets as Tweet[];
    } catch (error) {
      console.error('Error finding drafts by user ID:', error);
      throw error;
    }
  }

  // Find completed tweets by user ID
  static async findCompletedByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return tweets as Tweet[];
    } catch (error) {
      console.error('Error finding completed tweets by user ID:', error);
      throw error;
    }
  }

  // Update tweet content
  static async updateContent(id: string, content: string): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        UPDATE tweets 
        SET content = ${content}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, user_id, content, status, created_at, updated_at
      `;
      
      return tweets.length > 0 ? tweets[0] as Tweet : null;
    } catch (error) {
      console.error('Error updating tweet content:', error);
      throw error;
    }
  }

  // Update tweet status
  static async updateStatus(id: string, status: 'draft' | 'completed'): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        UPDATE tweets 
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, user_id, content, status, created_at, updated_at
      `;
      
      return tweets.length > 0 ? tweets[0] as Tweet : null;
    } catch (error) {
      console.error('Error updating tweet status:', error);
      throw error;
    }
  }

  // Update both content and status
  static async update(
    id: string,
    updates: {
      content?: string;
      status?: 'draft' | 'completed';
    }
  ): Promise<Tweet | null> {
    try {
      const { content, status } = updates;
      
      if (!content && !status) {
        throw new Error('At least one field must be updated');
      }

      if (content && status) {
        const tweets = await sql`
          UPDATE tweets 
          SET content = ${content}, status = ${status}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, user_id, content, status, created_at, updated_at
        `;
        return tweets.length > 0 ? tweets[0] as Tweet : null;
      } else if (content) {
        return await this.updateContent(id, content);
      } else if (status) {
        return await this.updateStatus(id, status);
      }
      
      return null;
    } catch (error) {
      console.error('Error updating tweet:', error);
      throw error;
    }
  }

  // Delete tweet
  static async delete(id: string): Promise<boolean> {
    try {
      await sql`
        DELETE FROM tweets 
        WHERE id = ${id}
      `;
      
      return true;
    } catch (error) {
      console.error('Error deleting tweet:', error);
      return false;
    }
  }

  // Get user's tweet statistics
  static async getUserTweetStats(userId: string): Promise<{
    total: number;
    drafts: number;
    completed: number;
  }> {
    try {
      const stats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM tweets 
        WHERE user_id = ${userId}
      `;
      
      const result = stats[0];
      return {
        total: parseInt(result.total || '0'),
        drafts: parseInt(result.drafts || '0'),
        completed: parseInt(result.completed || '0'),
      };
    } catch (error) {
      console.error('Error getting user tweet stats:', error);
      throw error;
    }
  }

  // Search tweets by content
  static async searchByContent(
    userId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} 
        AND content ILIKE ${`%${searchTerm}%`}
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
      
      return tweets as Tweet[];
    } catch (error) {
      console.error('Error searching tweets by content:', error);
      throw error;
    }
  }

  // Count tweets by user and status
  static async countByUserAndStatus(
    userId: string,
    status?: 'draft' | 'completed'
  ): Promise<number> {
    try {
      let result;
      if (status) {
        result = await sql`
          SELECT COUNT(*) as count
          FROM tweets 
          WHERE user_id = ${userId} AND status = ${status}
        `;
      } else {
        result = await sql`
          SELECT COUNT(*) as count
          FROM tweets 
          WHERE user_id = ${userId}
        `;
      }
      
      return parseInt(result[0].count || '0');
    } catch (error) {
      console.error('Error counting tweets:', error);
      throw error;
    }
  }

  // Verify user owns tweet (for authorization)
  static async verifyOwnership(tweetId: string, userId: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT EXISTS(
          SELECT 1 FROM tweets 
          WHERE id = ${tweetId} AND user_id = ${userId}
        )
      `;
      
      return result[0].exists || false;
    } catch (error) {
      console.error('Error verifying tweet ownership:', error);
      return false;
    }
  }
} 