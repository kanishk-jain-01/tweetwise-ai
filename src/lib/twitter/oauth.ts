import { sql } from '../database';
import { createTwitterOAuthClient } from './client';

// OAuth State Management
interface OAuthState {
  codeVerifier: string;
  state: string;
  userId: string;
  createdAt: Date;
}

// In-memory storage for OAuth states (in production, use Redis or database)
const oauthStates = new Map<string, OAuthState>();

// Twitter User Token Storage Interface (matches database schema)
export interface TwitterTokens {
  id?: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  twitter_user_id: string;
  twitter_username: string;
  twitter_name: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// OAuth Flow Handlers
export class TwitterOAuth {
  // Step 1: Generate authorization URL and store state
  static async generateAuthUrl(
    userId: string
  ): Promise<{ authUrl: string; state: string }> {
    try {
      const client = createTwitterOAuthClient();
      const stateId = `twitter_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { authUrl, codeVerifier, state } =
        await client.generateAuthLink(stateId);

      // Store OAuth state securely
      oauthStates.set(stateId, {
        codeVerifier,
        state,
        userId,
        createdAt: new Date(),
      });

      // Clean up old states (older than 10 minutes)
      this.cleanupExpiredStates();

      return {
        authUrl,
        state: stateId,
      };
    } catch (error) {
      console.error('Error generating Twitter auth URL:', error);
      throw new Error('Failed to generate Twitter authentication URL');
    }
  }

  // Step 2: Handle OAuth callback and exchange code for tokens
  static async handleCallback(
    code: string,
    state: string
  ): Promise<TwitterTokens> {
    try {
      // Retrieve and validate OAuth state
      const oauthState = oauthStates.get(state);
      if (!oauthState) {
        throw new Error('Invalid or expired OAuth state');
      }

      // Check if state is expired (10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (oauthState.createdAt < tenMinutesAgo) {
        oauthStates.delete(state);
        throw new Error('OAuth state has expired');
      }

      // Exchange code for tokens
      const client = createTwitterOAuthClient();
      const { accessToken, refreshToken, user } =
        await client.exchangeCodeForTokens(code, oauthState.codeVerifier);

      // Clean up OAuth state
      oauthStates.delete(state);

      // Store tokens in database
      const tokens = await this.storeUserTokens({
        userId: oauthState.userId,
        accessToken,
        refreshToken,
        twitterUserId: user.id,
        twitterUsername: user.username,
        twitterName: user.name,
      });

      return tokens;
    } catch (error) {
      console.error('Error handling Twitter OAuth callback:', error);
      throw new Error('Failed to complete Twitter authentication');
    }
  }

  // Store user tokens in database
  static async storeUserTokens(tokenData: {
    userId: string;
    accessToken: string;
    refreshToken: string | null;
    twitterUserId: string;
    twitterUsername: string;
    twitterName: string;
  }): Promise<TwitterTokens> {
    try {
      // First, remove any existing tokens for this user
      await sql`
        DELETE FROM twitter_tokens 
        WHERE user_id = ${tokenData.userId}
      `;

      // Debug: Log what we're trying to store
      console.log('=== STORING TOKENS TO DATABASE ===');
      console.log('Input data:', {
        userId: tokenData.userId,
        accessTokenLength: tokenData.accessToken?.length,
        accessTokenPrefix: tokenData.accessToken?.substring(0, 20) + '...',
        refreshTokenLength: tokenData.refreshToken?.length,
        twitterUserId: tokenData.twitterUserId,
        twitterUsername: tokenData.twitterUsername,
        twitterName: tokenData.twitterName
      });

      // Insert new tokens (refresh_token can be null)
      const result = await sql`
        INSERT INTO twitter_tokens (
          user_id, 
          access_token, 
          refresh_token, 
          twitter_user_id, 
          twitter_username, 
          twitter_name,
          created_at,
          updated_at
        ) VALUES (
          ${tokenData.userId},
          ${tokenData.accessToken},
          ${tokenData.refreshToken || null},
          ${tokenData.twitterUserId},
          ${tokenData.twitterUsername},
          ${tokenData.twitterName},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      console.log('Database result:', {
        resultLength: result.length,
        firstRow: result[0] ? {
          user_id: result[0].user_id,
          access_token: result[0].access_token ? 'EXISTS' : 'NULL',
          access_token_length: result[0].access_token?.length,
          refresh_token: result[0].refresh_token ? 'EXISTS' : 'NULL',
          twitter_user_id: result[0].twitter_user_id,
          twitter_username: result[0].twitter_username,
          twitter_name: result[0].twitter_name
        } : 'NO_ROW'
      });

      if (result.length === 0) {
        throw new Error('Failed to store Twitter tokens');
      }

      return result[0] as TwitterTokens;
    } catch (error) {
      console.error('Error storing Twitter tokens:', error);
      throw new Error('Failed to store Twitter authentication tokens');
    }
  }

  // Retrieve user tokens from database
  static async getUserTokens(userId: string): Promise<TwitterTokens | null> {
    try {
      const result = await sql`
        SELECT * FROM twitter_tokens 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      console.log('=== RETRIEVING TOKENS FROM DATABASE ===');
      console.log('Query result:', {
        userId,
        resultLength: result.length,
        firstRow: result[0] ? {
          user_id: result[0].user_id,
          access_token: result[0].access_token ? 'EXISTS' : 'NULL',
          access_token_length: result[0].access_token?.length,
          refresh_token: result[0].refresh_token ? 'EXISTS' : 'NULL',
          twitter_user_id: result[0].twitter_user_id,
          twitter_username: result[0].twitter_username,
          twitter_name: result[0].twitter_name,
          allKeys: Object.keys(result[0])
        } : 'NO_ROW'
      });

      return result.length > 0 ? (result[0] as TwitterTokens) : null;
    } catch (error) {
      console.error('Error retrieving Twitter tokens:', error);
      return null;
    }
  }

  // Check if user has valid Twitter tokens
  static async isUserConnected(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getUserTokens(userId);
      return tokens !== null;
    } catch (error) {
      console.error('Error checking Twitter connection status:', error);
      return false;
    }
  }

  // Refresh access token using refresh token
  static async refreshUserTokens(
    userId: string
  ): Promise<TwitterTokens | null> {
    try {
      const currentTokens = await this.getUserTokens(userId);
      if (!currentTokens) {
        throw new Error('No Twitter tokens found for user');
      }

      // Check if we have a refresh token
      if (!currentTokens.refresh_token) {
        console.warn('No refresh token available for user:', userId);
        // If no refresh token, we can't refresh - disconnect user
        await this.disconnectUser(userId);
        return null;
      }

      const client = createTwitterOAuthClient();
      const { accessToken, refreshToken } = await client.refreshAccessToken(
        currentTokens.refresh_token
      );

      // Update tokens in database
      const result = await sql`
        UPDATE twitter_tokens 
        SET 
          access_token = ${accessToken},
          refresh_token = ${refreshToken || null},
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;

      return result.length > 0 ? (result[0] as TwitterTokens) : null;
    } catch (error) {
      console.error('Error refreshing Twitter tokens:', error);
      // If refresh fails, remove invalid tokens
      await this.disconnectUser(userId);
      return null;
    }
  }

  // Disconnect user from Twitter (remove tokens)
  static async disconnectUser(userId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM twitter_tokens 
        WHERE user_id = ${userId}
      `;
    } catch (error) {
      console.error('Error disconnecting Twitter user:', error);
      throw new Error('Failed to disconnect Twitter account');
    }
  }

  // Get Twitter user info for connected user
  static async getTwitterUserInfo(userId: string): Promise<{
    id: string;
    username: string;
    name: string;
  } | null> {
    try {
      const tokens = await this.getUserTokens(userId);
      if (!tokens) {
        return null;
      }

      return {
        id: tokens.twitter_user_id,
        username: tokens.twitter_username,
        name: tokens.twitter_name,
      };
    } catch (error) {
      console.error('Error getting Twitter user info:', error);
      return null;
    }
  }

  // Clean up expired OAuth states (older than 10 minutes)
  static cleanupExpiredStates(): void {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    for (const [key, state] of oauthStates.entries()) {
      if (state.createdAt < tenMinutesAgo) {
        oauthStates.delete(key);
      }
    }
  }

  // Validate OAuth state format
  static isValidStateFormat(state: string): boolean {
    return /^twitter_[a-f0-9-]+_\d+_[a-z0-9]+$/i.test(state);
  }
}

// Database schema for twitter_tokens table (for reference)
/*
CREATE TABLE twitter_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  twitter_user_id TEXT NOT NULL,
  twitter_username TEXT NOT NULL,
  twitter_name TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_twitter_tokens_user_id ON twitter_tokens(user_id);
CREATE INDEX idx_twitter_tokens_twitter_user_id ON twitter_tokens(twitter_user_id);
*/

// Utility functions for OAuth flow
export const TwitterOAuthUtils = {
  // Generate secure random state
  generateSecureState: (): string => {
    return `twitter_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  },

  // Validate callback parameters
  validateCallbackParams: (code?: string, state?: string, error?: string) => {
    if (error) {
      throw new Error(`Twitter OAuth error: ${error}`);
    }

    if (!code || !state) {
      throw new Error('Missing required OAuth callback parameters');
    }

    if (!TwitterOAuth.isValidStateFormat(state)) {
      throw new Error('Invalid OAuth state format');
    }

    return { code, state };
  },

  // Extract user ID from state
  extractUserIdFromState: (state: string): string | null => {
    const match = state.match(/^twitter_([a-f0-9-]+)_\d+_[a-z0-9]+$/i);
    return match && match[1] ? match[1] : null;
  },
};
