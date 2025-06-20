import { createAuthenticatedTwitterClient } from './client';
import { TwitterOAuth, TwitterTokens } from './oauth';

// Token validation result
export interface TokenValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

// Twitter user connection status
export interface TwitterConnectionStatus {
  isConnected: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
  };
  tokenExpiry?: Date;
  lastVerified?: Date;
}

// Secure token management service
export class TwitterTokenManager {
  
  // Get user's Twitter tokens with validation
  static async getValidTokens(userId: string): Promise<TwitterTokens | null> {
    try {
      let tokens = await TwitterOAuth.getUserTokens(userId);
      
      if (!tokens) {
        return null;
      }
      
      // Validate tokens by attempting to verify credentials
      const validation = await this.validateTokens(tokens);
      
      if (!validation.isValid) {
        if (validation.needsRefresh) {
          // Attempt to refresh tokens
          tokens = await this.refreshTokensIfNeeded(userId);
          if (!tokens) {
            return null;
          }
        } else {
          // Tokens are invalid and can't be refreshed
          await TwitterOAuth.disconnectUser(userId);
          return null;
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Error getting valid tokens:', error);
      return null;
    }
  }
  
  // Validate tokens by testing with Twitter API
  static async validateTokens(tokens: TwitterTokens): Promise<TokenValidationResult> {
    try {
      const client = createAuthenticatedTwitterClient(
        tokens.accessToken, 
        tokens.refreshToken
      );
      
      // Test tokens by verifying credentials
      await client.verifyCredentials();
      
      return {
        isValid: true,
        needsRefresh: false,
      };
    } catch (error: any) {
      console.error('Token validation failed:', error);
      
      const errorMessage = error?.message || '';
      
      // Check if error indicates expired tokens that can be refreshed
      if (errorMessage.includes('expired') || errorMessage.includes('invalid_token')) {
        return {
          isValid: false,
          needsRefresh: true,
          error: 'Tokens expired, refresh needed',
        };
      }
      
      // Check if error indicates revoked or permanently invalid tokens
      if (errorMessage.includes('revoked') || errorMessage.includes('unauthorized')) {
        return {
          isValid: false,
          needsRefresh: false,
          error: 'Tokens revoked or unauthorized',
        };
      }
      
      // For other errors, assume tokens need refresh
      return {
        isValid: false,
        needsRefresh: true,
        error: errorMessage,
      };
    }
  }
  
  // Refresh tokens if needed and return updated tokens
  static async refreshTokensIfNeeded(userId: string): Promise<TwitterTokens | null> {
    try {
      const refreshedTokens = await TwitterOAuth.refreshUserTokens(userId);
      
      if (!refreshedTokens) {
        console.log(`Failed to refresh tokens for user ${userId}`);
        return null;
      }
      
      // Validate refreshed tokens
      const validation = await this.validateTokens(refreshedTokens);
      
      if (!validation.isValid) {
        console.log(`Refreshed tokens are still invalid for user ${userId}`);
        await TwitterOAuth.disconnectUser(userId);
        return null;
      }
      
      console.log(`Successfully refreshed tokens for user ${userId}`);
      return refreshedTokens;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      // Clean up invalid tokens
      await TwitterOAuth.disconnectUser(userId);
      return null;
    }
  }
  
  // Get comprehensive connection status for a user
  static async getConnectionStatus(userId: string): Promise<TwitterConnectionStatus> {
    try {
      const tokens = await TwitterOAuth.getUserTokens(userId);
      
      if (!tokens) {
        return { isConnected: false };
      }
      
      // Get Twitter user info
      const userInfo = await TwitterOAuth.getTwitterUserInfo(userId);
      
      // Validate tokens
      const validation = await this.validateTokens(tokens);
      
      return {
        isConnected: validation.isValid,
        user: userInfo || undefined,
        tokenExpiry: tokens.expiresAt,
        lastVerified: new Date(),
      };
    } catch (error) {
      console.error('Error getting connection status:', error);
      return { isConnected: false };
    }
  }
  
  // Create authenticated Twitter client for a user
  static async createClientForUser(userId: string) {
    const tokens = await this.getValidTokens(userId);
    
    if (!tokens) {
      throw new Error('User is not connected to Twitter or tokens are invalid');
    }
    
    return createAuthenticatedTwitterClient(tokens.accessToken, tokens.refreshToken);
  }
  
  // Securely store new tokens after OAuth flow
  static async storeTokensSecurely(tokenData: {
    userId: string;
    accessToken: string;
    refreshToken: string;
    twitterUserId: string;
    twitterUsername: string;
    twitterName: string;
  }): Promise<TwitterTokens> {
    try {
      // Store tokens using OAuth handler
      const storedTokens = await TwitterOAuth.storeUserTokens(tokenData);
      
      // Validate newly stored tokens
      const validation = await this.validateTokens(storedTokens);
      
      if (!validation.isValid) {
        // If tokens are invalid immediately after storage, clean up
        await TwitterOAuth.disconnectUser(tokenData.userId);
        throw new Error('Stored tokens failed validation');
      }
      
      console.log(`Securely stored and validated tokens for user ${tokenData.userId}`);
      return storedTokens;
    } catch (error) {
      console.error('Error storing tokens securely:', error);
      throw error;
    }
  }
  
  // Disconnect user and clean up all token data
  static async disconnectUserSecurely(userId: string): Promise<void> {
    try {
      await TwitterOAuth.disconnectUser(userId);
      console.log(`Securely disconnected user ${userId} from Twitter`);
    } catch (error) {
      console.error('Error disconnecting user securely:', error);
      throw error;
    }
  }
  
  // Batch validate multiple users' tokens (for maintenance tasks)
  static async validateAllUserTokens(): Promise<{
    valid: number;
    refreshed: number;
    removed: number;
    errors: string[];
  }> {
    const result = {
      valid: 0,
      refreshed: 0,
      removed: 0,
      errors: [] as string[],
    };
    
    try {
      // This would need a method to get all users with tokens
      // For now, this is a placeholder for future implementation
      console.log('Batch token validation not yet implemented');
      
      return result;
    } catch (error) {
      console.error('Error in batch token validation:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }
  
  // Get token expiry information
  static async getTokenExpiry(userId: string): Promise<{
    hasTokens: boolean;
    expiresAt?: Date;
    isExpired?: boolean;
    expiresInHours?: number;
  }> {
    try {
      const tokens = await TwitterOAuth.getUserTokens(userId);
      
      if (!tokens) {
        return { hasTokens: false };
      }
      
      if (!tokens.expiresAt) {
        return { 
          hasTokens: true,
          expiresAt: undefined,
          isExpired: false,
        };
      }
      
      const now = new Date();
      const isExpired = tokens.expiresAt < now;
      const expiresInHours = Math.max(0, (tokens.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      return {
        hasTokens: true,
        expiresAt: tokens.expiresAt,
        isExpired,
        expiresInHours,
      };
    } catch (error) {
      console.error('Error getting token expiry:', error);
      return { hasTokens: false };
    }
  }
}

// Utility functions for token management
export const TokenUtils = {
  // Check if user needs to reconnect Twitter
  isReconnectionNeeded: async (userId: string): Promise<boolean> => {
    const status = await TwitterTokenManager.getConnectionStatus(userId);
    return !status.isConnected;
  },
  
  // Get user's Twitter handle safely
  getTwitterHandle: async (userId: string): Promise<string | null> => {
    const userInfo = await TwitterOAuth.getTwitterUserInfo(userId);
    return userInfo ? `@${userInfo.username}` : null;
  },
  
  // Check if user has valid Twitter connection
  hasValidConnection: async (userId: string): Promise<boolean> => {
    const tokens = await TwitterTokenManager.getValidTokens(userId);
    return tokens !== null;
  },
  
  // Get connection age in days
  getConnectionAge: async (userId: string): Promise<number | null> => {
    const tokens = await TwitterOAuth.getUserTokens(userId);
    if (!tokens) return null;
    
    const now = new Date();
    const created = new Date(tokens.createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  },
};

// Token security configuration
export const TOKEN_SECURITY_CONFIG = {
  // How often to validate tokens (in hours)
  VALIDATION_INTERVAL_HOURS: 24,
  
  // How long before expiry to refresh tokens (in hours)
  REFRESH_THRESHOLD_HOURS: 24,
  
  // Maximum age for tokens before requiring re-authentication (in days)
  MAX_TOKEN_AGE_DAYS: 90,
  
  // Rate limiting for token operations
  MAX_REFRESH_ATTEMPTS_PER_HOUR: 5,
  MAX_VALIDATION_ATTEMPTS_PER_HOUR: 10,
}; 