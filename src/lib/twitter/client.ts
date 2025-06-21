// Twitter API Configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const CALLBACK_URL =
  process.env.TWITTER_CALLBACK_URL ||
  `${process.env.NEXTAUTH_URL}/api/twitter/callback`;

// Dynamic import function for TwitterApi
async function getTwitterApi() {
  const { TwitterApi } = await import('twitter-api-v2');
  return TwitterApi;
}

// Twitter API Client Class
export class TwitterClient {
  private client: any;

  constructor(accessToken?: string, accessSecret?: string) {
    // Initialize client as null, will be set up in init method
    this.client = null;
    this.accessToken = accessToken;
    this.accessSecret = accessSecret;
  }

  private accessToken?: string;
  private accessSecret?: string;

  // Initialize the Twitter client
  private async initClient() {
    if (this.client) return this.client;

    const TwitterApi = await getTwitterApi();

    if (this.accessToken && this.accessSecret) {
      // Authenticated client for posting tweets
      this.client = new TwitterApi({
        appKey: TWITTER_CLIENT_ID,
        appSecret: TWITTER_CLIENT_SECRET,
        accessToken: this.accessToken,
        accessSecret: this.accessSecret,
      });
    } else {
      // App-only client for OAuth flow initiation
      this.client = new TwitterApi({
        clientId: TWITTER_CLIENT_ID,
        clientSecret: TWITTER_CLIENT_SECRET,
      });
    }

    return this.client;
  }

  // Initialize OAuth 2.0 PKCE flow
  async generateAuthLink(state?: string) {
    try {
      const client = await this.initClient();
      const {
        url,
        codeVerifier,
        state: oauthState,
      } = client.generateOAuth2AuthLink(CALLBACK_URL, {
        scope: ['tweet.read', 'tweet.write', 'users.read'],
        state: state || 'default',
      });

      return {
        authUrl: url,
        codeVerifier,
        state: oauthState,
      };
    } catch (error) {
      console.error('Error generating Twitter auth link:', error);
      throw new Error('Failed to generate Twitter authentication link');
    }
  }

  // Exchange authorization code for access tokens
  async exchangeCodeForTokens(code: string, codeVerifier: string) {
    try {
      const client = await this.initClient();
      const {
        client: loggedClient,
        accessToken,
        refreshToken,
      } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: CALLBACK_URL,
      });

      // Get user information
      const { data: userObject } = await loggedClient.v2.me();

      return {
        accessToken,
        refreshToken,
        user: {
          id: userObject.id,
          username: userObject.username,
          name: userObject.name,
        },
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Twitter');
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string) {
    try {
      const client = await this.initClient();
      const { accessToken, refreshToken: newRefreshToken } =
        await client.refreshOAuth2Token(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error('Error refreshing Twitter token:', error);
      throw new Error('Failed to refresh Twitter access token');
    }
  }

  // Post a tweet
  async postTweet(content: string) {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('Twitter client is not authenticated');
      }

      // Validate tweet content
      if (!content.trim()) {
        throw new Error('Tweet content cannot be empty');
      }

      if (content.length > 280) {
        throw new Error('Tweet content exceeds 280 character limit');
      }

      const client = await this.initClient();
      const { data: createdTweet } = await client.v2.tweet(content);

      return {
        id: createdTweet.id,
        text: createdTweet.text,
      };
    } catch (error) {
      console.error('Error posting tweet:', error);

      // Handle specific Twitter API errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          throw new Error('This tweet appears to be a duplicate');
        }
        if (error.message.includes('rate limit')) {
          throw new Error(
            'Twitter rate limit exceeded. Please try again later.'
          );
        }
      }

      throw new Error('Failed to post tweet to Twitter');
    }
  }

  // Get user's recent tweets
  async getUserTweets(userId: string, maxResults: number = 10) {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('Twitter client is not authenticated');
      }

      const client = await this.initClient();
      const { data: tweets } = await client.v2.userTimeline(userId, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'public_metrics'],
      });

      return tweets || [];
    } catch (error) {
      console.error('Error fetching user tweets:', error);
      throw new Error('Failed to fetch tweets from Twitter');
    }
  }

  // Verify credentials and get user info
  async verifyCredentials() {
    try {
      if (!(await this.isAuthenticated())) {
        throw new Error('Twitter client is not authenticated');
      }

      const client = await this.initClient();
      const { data: user } = await client.v2.me({
        'user.fields': ['public_metrics', 'verified'],
      });

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        verified: user.verified || false,
        followersCount: user.public_metrics?.followers_count || 0,
        followingCount: user.public_metrics?.following_count || 0,
        tweetCount: user.public_metrics?.tweet_count || 0,
      };
    } catch (error) {
      console.error('Error verifying Twitter credentials:', error);
      throw new Error('Failed to verify Twitter credentials');
    }
  }

  // Check if client is authenticated
  private async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken) return false;
    const client = await this.initClient();
    return client.hasAccessToken();
  }

  // Get rate limit status
  async getRateLimitStatus() {
    try {
      const client = await this.initClient();
      const rateLimits = await client.v1.getRateLimitStatuses();
      return rateLimits;
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  }
}

// Utility function to create authenticated Twitter client
export function createAuthenticatedTwitterClient(
  accessToken: string,
  accessSecret: string
) {
  return new TwitterClient(accessToken, accessSecret);
}

// Utility function to create app-only Twitter client for OAuth
export function createTwitterOAuthClient() {
  return new TwitterClient();
}

// Twitter API Error Types
export interface TwitterError {
  type: 'duplicate' | 'rate_limit' | 'auth_error' | 'api_error' | 'unknown';
  message: string;
  originalError?: any;
}

// Helper function to parse Twitter API errors
export function parseTwitterError(error: any): TwitterError {
  const message = error?.message || 'Unknown Twitter API error';

  if (message.includes('duplicate')) {
    return {
      type: 'duplicate',
      message: 'This tweet appears to be a duplicate',
      originalError: error,
    };
  }

  if (message.includes('rate limit')) {
    return {
      type: 'rate_limit',
      message: 'Twitter rate limit exceeded',
      originalError: error,
    };
  }

  if (message.includes('auth') || message.includes('unauthorized')) {
    return {
      type: 'auth_error',
      message: 'Twitter authentication failed',
      originalError: error,
    };
  }

  if (message.includes('API')) {
    return {
      type: 'api_error',
      message: 'Twitter API error occurred',
      originalError: error,
    };
  }

  return { type: 'unknown', message, originalError: error };
}
