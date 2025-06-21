import { sql } from './index';
import type { Tweet } from './schema';

// Twitter user info interface
interface TwitterUserInfo {
  twitterUserId: string;
  twitterUsername: string;
  twitterName: string;
  updatedAt: Date;
}

// Twitter-specific Query Functions
export class TwitterQueries {
  // Schedule a tweet for future posting
  static async scheduleTweet(tweetData: {
    user_id: string;
    content: string;
    scheduled_for: Date;
  }): Promise<Tweet> {
    try {
      const tweets = await sql`
        INSERT INTO tweets (user_id, content, status, scheduled_for, created_at, updated_at)
        VALUES (${tweetData.user_id}, ${tweetData.content}, 'scheduled', ${tweetData.scheduled_for.toISOString()}, NOW(), NOW())
        RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
      `;

      if (tweets.length === 0) {
        throw new Error('Failed to schedule tweet');
      }

      return tweets[0] as Tweet;
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      throw error;
    }
  }

  // Update tweet to sent status with Twitter ID
  static async markAsSent(
    id: string,
    twitterId: string,
    sentAt: Date = new Date()
  ): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        UPDATE tweets 
        SET status = 'sent', 
            tweet_id = ${twitterId}, 
            sent_at = ${sentAt.toISOString()}, 
            error_message = NULL,
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
      `;

      return tweets.length > 0 ? (tweets[0] as Tweet) : null;
    } catch (error) {
      console.error('Error marking tweet as sent:', error);
      throw error;
    }
  }

  // Update tweet with error message on failed posting
  static async markAsError(
    id: string,
    errorMessage: string
  ): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        UPDATE tweets 
        SET error_message = ${errorMessage},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
      `;

      return tweets.length > 0 ? (tweets[0] as Tweet) : null;
    } catch (error) {
      console.error('Error marking tweet with error:', error);
      throw error;
    }
  }

  // Get tweets ready for posting (scheduled tweets that are due)
  static async getScheduledTweetsDue(limit: number = 50): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE status = 'scheduled' 
        AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        LIMIT ${limit}
      `;

      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting scheduled tweets due:', error);
      throw error;
    }
  }

  // Get all scheduled tweets for a user
  static async getScheduledTweetsByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} AND status = 'scheduled'
        ORDER BY scheduled_for ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting scheduled tweets by user:', error);
      throw error;
    }
  }

  // Get sent tweets for a user
  static async getSentTweetsByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} AND status = 'sent'
        ORDER BY sent_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting sent tweets by user:', error);
      throw error;
    }
  }

  // Get tweets with errors for a user
  static async getFailedTweetsByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} 
        AND error_message IS NOT NULL
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting failed tweets by user:', error);
      throw error;
    }
  }

  // Update scheduled time for a tweet
  static async updateScheduledTime(
    id: string,
    scheduledFor: Date
  ): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        UPDATE tweets 
        SET scheduled_for = ${scheduledFor.toISOString()}, 
            updated_at = NOW()
        WHERE id = ${id} AND status = 'scheduled'
        RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
      `;

      return tweets.length > 0 ? (tweets[0] as Tweet) : null;
    } catch (error) {
      console.error('Error updating scheduled time:', error);
      throw error;
    }
  }

  // Cancel scheduled tweet (change back to draft)
  static async cancelScheduledTweet(id: string): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        UPDATE tweets 
        SET status = 'draft', 
            scheduled_for = NULL, 
            error_message = NULL,
            updated_at = NOW()
        WHERE id = ${id} AND status = 'scheduled'
        RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
      `;

      return tweets.length > 0 ? (tweets[0] as Tweet) : null;
    } catch (error) {
      console.error('Error canceling scheduled tweet:', error);
      throw error;
    }
  }

  // Get Twitter stats for a user
  static async getTwitterStats(userId: string): Promise<{
    scheduled: number;
    sent: number;
    failed: number;
    totalScheduled: number;
  }> {
    try {
      const stats = await sql`
        SELECT 
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed,
          COUNT(CASE WHEN status IN ('scheduled', 'sent') THEN 1 END) as total_scheduled
        FROM tweets 
        WHERE user_id = ${userId}
      `;

      const result = stats[0];
      return {
        scheduled: parseInt(result?.scheduled || '0'),
        sent: parseInt(result?.sent || '0'),
        failed: parseInt(result?.failed || '0'),
        totalScheduled: parseInt(result?.total_scheduled || '0'),
      };
    } catch (error) {
      console.error('Error getting Twitter stats:', error);
      throw error;
    }
  }

  // Find tweet by Twitter ID
  static async findByTwitterId(twitterId: string): Promise<Tweet | null> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE tweet_id = ${twitterId}
        LIMIT 1
      `;

      return tweets.length > 0 ? (tweets[0] as Tweet) : null;
    } catch (error) {
      console.error('Error finding tweet by Twitter ID:', error);
      throw error;
    }
  }

  // Get upcoming scheduled tweets (next 24 hours)
  static async getUpcomingScheduled(
    userId: string,
    limit: number = 10
  ): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} 
        AND status = 'scheduled'
        AND scheduled_for > NOW()
        AND scheduled_for <= NOW() + INTERVAL '24 hours'
        ORDER BY scheduled_for ASC
        LIMIT ${limit}
      `;

      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting upcoming scheduled tweets:', error);
      throw error;
    }
  }

  // Retry failed tweet (clear error and reset to scheduled)
  static async retryFailedTweet(
    id: string,
    newScheduledTime?: Date
  ): Promise<Tweet | null> {
    try {
      const scheduledFor = newScheduledTime || new Date();

      const tweets = await sql`
        UPDATE tweets 
        SET status = 'scheduled',
            scheduled_for = ${scheduledFor.toISOString()},
            error_message = NULL,
            updated_at = NOW()
        WHERE id = ${id} AND error_message IS NOT NULL
        RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
      `;

      return tweets.length > 0 ? (tweets[0] as Tweet) : null;
    } catch (error) {
      console.error('Error retrying failed tweet:', error);
      throw error;
    }
  }

  // Get tweet posting queue (scheduled tweets ordered by time)
  static async getPostingQueue(limit: number = 100): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE status = 'scheduled'
        ORDER BY scheduled_for ASC
        LIMIT ${limit}
      `;

      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting posting queue:', error);
      throw error;
    }
  }

  // Instance methods for API route compatibility
  async updateUserTwitterInfo(
    userId: string,
    info: {
      twitterUserId: string;
      twitterUsername: string;
      twitterName: string;
    }
  ): Promise<void> {
    return TwitterQueries.updateUserTwitterInfo(userId, info);
  }

  async clearUserTwitterInfo(userId: string): Promise<void> {
    return TwitterQueries.clearUserTwitterInfo(userId);
  }

  async convertScheduledTweetsToDrafts(userId: string): Promise<number> {
    return TwitterQueries.convertScheduledTweetsToDrafts(userId);
  }

  async getUserTwitterInfo(userId: string): Promise<TwitterUserInfo | null> {
    return TwitterQueries.getUserTwitterInfo(userId);
  }

  async getScheduledTweetsCount(userId: string): Promise<number> {
    return TwitterQueries.getScheduledTweetsCount(userId);
  }

  async updateTweetStatus(
    tweetId: string,
    userId: string,
    status: string,
    data: any
  ): Promise<Tweet> {
    return TwitterQueries.updateTweetStatus(tweetId, userId, status, data);
  }

  async createTweet(tweetData: any): Promise<Tweet> {
    return TwitterQueries.createTweet(tweetData);
  }

  async getSentTweets(
    userId: string,
    limit: number,
    offset: number
  ): Promise<Tweet[]> {
    return TwitterQueries.getSentTweets(userId, limit, offset);
  }

  async getScheduledTweets(
    userId: string,
    limit: number,
    offset: number,
    includeExpired?: boolean
  ): Promise<Tweet[]> {
    return TwitterQueries.getScheduledTweets(
      userId,
      limit,
      offset,
      includeExpired
    );
  }

  async deleteScheduledTweet(
    tweetId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await sql`
        WITH deleted AS (
          DELETE FROM tweets 
          WHERE id = ${tweetId} AND user_id = ${userId} AND status = 'scheduled'
          RETURNING id
        )
        SELECT COUNT(*) as count FROM deleted
      `;
      return parseInt(result[0]?.count || '0') > 0;
    } catch (error) {
      console.error('Error deleting scheduled tweet:', error);
      throw error;
    }
  }

  // Static methods (existing and new)

  // Update user's Twitter info in users table
  static async updateUserTwitterInfo(
    userId: string,
    info: {
      twitterUserId: string;
      twitterUsername: string;
      twitterName: string;
    }
  ): Promise<void> {
    try {
      await sql`
        UPDATE users 
        SET 
          twitter_user_id = ${info.twitterUserId},
          twitter_username = ${info.twitterUsername},
          twitter_name = ${info.twitterName},
          updated_at = NOW()
        WHERE id = ${userId}
      `;
    } catch (error) {
      console.error('Error updating user Twitter info:', error);
      throw error;
    }
  }

  // Clear user's Twitter info
  static async clearUserTwitterInfo(userId: string): Promise<void> {
    try {
      await sql`
        UPDATE users 
        SET 
          twitter_user_id = NULL,
          twitter_username = NULL,
          twitter_name = NULL,
          updated_at = NOW()
        WHERE id = ${userId}
      `;
    } catch (error) {
      console.error('Error clearing user Twitter info:', error);
      throw error;
    }
  }

  // Convert all scheduled tweets to drafts for a user
  static async convertScheduledTweetsToDrafts(userId: string): Promise<number> {
    try {
      const result = await sql`
        WITH updated AS (
          UPDATE tweets 
          SET 
            status = 'draft',
            scheduled_for = NULL,
            updated_at = NOW()
          WHERE user_id = ${userId} AND status = 'scheduled'
          RETURNING id
        )
        SELECT COUNT(*) as count FROM updated
      `;
      return parseInt(result[0]?.count || '0');
    } catch (error) {
      console.error('Error converting scheduled tweets to drafts:', error);
      throw error;
    }
  }

  // Get user's Twitter info
  static async getUserTwitterInfo(
    userId: string
  ): Promise<TwitterUserInfo | null> {
    try {
      const result = await sql`
        SELECT twitter_user_id, twitter_username, twitter_name, updated_at
        FROM users 
        WHERE id = ${userId} AND twitter_user_id IS NOT NULL
      `;

      if (result.length === 0) {
        return null;
      }

      const user = result[0];
      if (!user) {
        return null;
      }

      return {
        twitterUserId: user.twitter_user_id,
        twitterUsername: user.twitter_username,
        twitterName: user.twitter_name,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      console.error('Error getting user Twitter info:', error);
      return null;
    }
  }

  // Get count of scheduled tweets for a user
  static async getScheduledTweetsCount(userId: string): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM tweets 
        WHERE user_id = ${userId} AND status = 'scheduled'
      `;
      return parseInt(result[0]?.count || '0');
    } catch (error) {
      console.error('Error getting scheduled tweets count:', error);
      return 0;
    }
  }

  // Update tweet status with additional data
  static async updateTweetStatus(
    tweetId: string,
    userId: string,
    status: string,
    data: any = {}
  ): Promise<Tweet> {
    try {
      // Use individual queries based on what data is provided
      // This is more reliable than dynamic SQL construction
      
      if (data.tweetId && data.sentAt) {
        // For successful tweet posting
        const result = await sql`
          UPDATE tweets 
          SET status = ${status}, 
              tweet_id = ${data.tweetId},
              sent_at = ${data.sentAt instanceof Date ? data.sentAt.toISOString() : data.sentAt},
              error_message = ${data.errorMessage || null},
              updated_at = NOW()
          WHERE id = ${tweetId} AND user_id = ${userId}
          RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        `;
        
        if (result.length === 0) {
          throw new Error('Tweet not found or access denied');
        }
        return result[0] as Tweet;
      } else if (data.scheduledFor) {
        // For scheduling tweets
        let result;
        if (data.content) {
          result = await sql`
            UPDATE tweets 
            SET status = ${status},
                content = ${data.content},
                scheduled_for = ${data.scheduledFor instanceof Date ? data.scheduledFor.toISOString() : data.scheduledFor},
                error_message = ${data.errorMessage || null},
                updated_at = NOW()
            WHERE id = ${tweetId} AND user_id = ${userId}
            RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
          `;
        } else {
          result = await sql`
            UPDATE tweets 
            SET status = ${status},
                scheduled_for = ${data.scheduledFor instanceof Date ? data.scheduledFor.toISOString() : data.scheduledFor},
                error_message = ${data.errorMessage || null},
                updated_at = NOW()
            WHERE id = ${tweetId} AND user_id = ${userId}
            RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
          `;
        }
        
        if (result.length === 0) {
          throw new Error('Tweet not found or access denied');
        }
        return result[0] as Tweet;
      } else if (data.errorMessage !== undefined) {
        // For error updates
        const result = await sql`
          UPDATE tweets 
          SET status = ${status},
              error_message = ${data.errorMessage},
              updated_at = NOW()
          WHERE id = ${tweetId} AND user_id = ${userId}
          RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        `;
        
        if (result.length === 0) {
          throw new Error('Tweet not found or access denied');
        }
        return result[0] as Tweet;
      } else {
        // Basic status update
        const result = await sql`
          UPDATE tweets 
          SET status = ${status},
              updated_at = NOW()
          WHERE id = ${tweetId} AND user_id = ${userId}
          RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        `;
        
        if (result.length === 0) {
          throw new Error('Tweet not found or access denied');
        }
        return result[0] as Tweet;
      }
    } catch (error) {
      console.error('Error updating tweet status:', error);
      throw error;
    }
  }

  // Create a new tweet
  static async createTweet(tweetData: {
    userId: string;
    content: string;
    status: string;
    scheduledFor?: Date;
    tweetId?: string;
    sentAt?: Date;
  }): Promise<Tweet> {
    try {
      const result = await sql`
        INSERT INTO tweets (
          user_id, 
          content, 
          status, 
          scheduled_for, 
          tweet_id, 
          sent_at,
          created_at, 
          updated_at
        ) VALUES (
          ${tweetData.userId},
          ${tweetData.content},
          ${tweetData.status},
          ${tweetData.scheduledFor ? tweetData.scheduledFor.toISOString() : null},
          ${tweetData.tweetId || null},
          ${tweetData.sentAt ? tweetData.sentAt.toISOString() : null},
          NOW(),
          NOW()
        )
        RETURNING id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
      `;

      if (result.length === 0) {
        throw new Error('Failed to create tweet');
      }

      return result[0] as Tweet;
    } catch (error) {
      console.error('Error creating tweet:', error);
      throw error;
    }
  }

  // Get sent tweets for a user
  static async getSentTweets(
    userId: string,
    limit: number,
    offset: number
  ): Promise<Tweet[]> {
    try {
      const tweets = await sql`
        SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
        FROM tweets 
        WHERE user_id = ${userId} AND status = 'sent'
        ORDER BY sent_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting sent tweets:', error);
      throw error;
    }
  }

  // Get scheduled tweets for a user
  static async getScheduledTweets(
    userId: string,
    limit: number,
    offset: number,
    includeExpired?: boolean
  ): Promise<Tweet[]> {
    try {
      let query;
      if (includeExpired) {
        query = sql`
          SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
          FROM tweets 
          WHERE user_id = ${userId} AND status = 'scheduled'
          ORDER BY scheduled_for ASC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        query = sql`
          SELECT id, user_id, content, status, scheduled_for, tweet_id, sent_at, error_message, created_at, updated_at
          FROM tweets 
          WHERE user_id = ${userId} AND status = 'scheduled' AND scheduled_for > NOW()
          ORDER BY scheduled_for ASC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      const tweets = await query;
      return tweets as Tweet[];
    } catch (error) {
      console.error('Error getting scheduled tweets:', error);
      throw error;
    }
  }
}
