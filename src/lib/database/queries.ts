import { sql } from './index';
import type { User } from './schema';

// Export TweetQueries from separate file to avoid complex linting issues
export { TweetQueries } from './tweet-queries';

// Export TwitterQueries for Twitter-specific operations
export { TwitterQueries } from './twitter-queries';

// User Query Functions
export class UserQueries {
  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await sql`
        SELECT id, email, password_hash, reset_token, reset_token_expiry, created_at, updated_at
        FROM users 
        WHERE email = ${email}
        LIMIT 1
      `;

      return users.length > 0 ? (users[0] as User) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    try {
      const users = await sql`
        SELECT id, email, password_hash, reset_token, reset_token_expiry, created_at, updated_at
        FROM users 
        WHERE id = ${id}
        LIMIT 1
      `;

      return users.length > 0 ? (users[0] as User) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData: {
    email: string;
    password_hash: string;
  }): Promise<User> {
    try {
      const users = await sql`
        INSERT INTO users (email, password_hash, created_at, updated_at)
        VALUES (${userData.email}, ${userData.password_hash}, NOW(), NOW())
        RETURNING id, email, password_hash, reset_token, reset_token_expiry, created_at, updated_at
      `;

      if (users.length === 0) {
        throw new Error('Failed to create user');
      }

      return users[0] as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user password
  static async updatePassword(
    id: string,
    password_hash: string
  ): Promise<void> {
    try {
      await sql`
        UPDATE users 
        SET password_hash = ${password_hash}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  // Set password reset token
  static async setResetToken(
    email: string,
    resetToken: string,
    expiryDate: Date
  ): Promise<void> {
    try {
      await sql`
        UPDATE users 
        SET reset_token = ${resetToken}, 
            reset_token_expiry = ${expiryDate.toISOString()},
            updated_at = NOW()
        WHERE email = ${email}
      `;
    } catch (error) {
      console.error('Error setting reset token:', error);
      throw error;
    }
  }

  // Find user by reset token
  static async findByResetToken(token: string): Promise<User | null> {
    try {
      const users = await sql`
        SELECT id, email, password_hash, reset_token, reset_token_expiry, created_at, updated_at
        FROM users 
        WHERE reset_token = ${token} 
        AND reset_token_expiry > NOW()
        LIMIT 1
      `;

      return users.length > 0 ? (users[0] as User) : null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  // Clear reset token
  static async clearResetToken(id: string): Promise<void> {
    try {
      await sql`
        UPDATE users 
        SET reset_token = NULL, 
            reset_token_expiry = NULL,
            updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error clearing reset token:', error);
      throw error;
    }
  }

  // Update user email
  static async updateEmail(id: string, email: string): Promise<void> {
    try {
      await sql`
        UPDATE users 
        SET email = ${email}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error updating user email:', error);
      throw error;
    }
  }

  // Delete user (and cascade to tweets and AI responses)
  static async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM users 
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT EXISTS(SELECT 1 FROM users WHERE email = ${email})
      `;

      return result[0]?.exists || false;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  // Get user stats (total tweets, drafts, etc.)
  static async getUserStats(userId: string): Promise<{
    totalTweets: number;
    drafts: number;
    completed: number;
  }> {
    try {
      const stats = await sql`
        SELECT 
          COUNT(*) as total_tweets,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM tweets 
        WHERE user_id = ${userId}
      `;

      const result = stats[0];
      return {
        totalTweets: parseInt(result?.total_tweets || '0'),
        drafts: parseInt(result?.drafts || '0'),
        completed: parseInt(result?.completed || '0'),
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Get user profile (without sensitive data)
  static async getProfile(
    id: string
  ): Promise<Omit<
    User,
    'password_hash' | 'reset_token' | 'reset_token_expiry'
  > | null> {
    try {
      const users = await sql`
        SELECT id, email, created_at, updated_at
        FROM users 
        WHERE id = ${id}
        LIMIT 1
      `;

      return users.length > 0
        ? (users[0] as Omit<
            User,
            'password_hash' | 'reset_token' | 'reset_token_expiry'
          >)
        : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // List all users (admin function - returns safe data only)
  static async listUsers(
    limit: number = 50,
    offset: number = 0
  ): Promise<
    Array<Omit<User, 'password_hash' | 'reset_token' | 'reset_token_expiry'>>
  > {
    try {
      const users = await sql`
        SELECT id, email, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return users as Array<
        Omit<User, 'password_hash' | 'reset_token' | 'reset_token_expiry'>
      >;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  // Count total users
  static async count(): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as total FROM users
      `;

      return parseInt(result[0]?.total || '0');
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }
}
