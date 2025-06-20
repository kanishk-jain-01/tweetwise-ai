import { sql } from './index';
import type { Tweet } from './schema';

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
}
