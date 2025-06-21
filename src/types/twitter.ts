// Twitter API related types and interfaces

// Twitter API v2 Tweet object (simplified)
export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

// Twitter API v2 User object (simplified)
export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
}

// OAuth 2.0 PKCE flow types
export interface TwitterOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'bearer';
  scope: string;
}

export interface TwitterOAuthState {
  state: string;
  code_verifier: string;
  code_challenge: string;
  redirect_uri: string;
}

// Tweet posting request/response types
export interface PostTweetRequest {
  text: string;
  scheduled_for?: Date;
}

export interface PostTweetResponse {
  success: boolean;
  tweet_id?: string;
  error?: string;
  scheduled?: boolean;
}

// Scheduled tweet processing types
export interface ScheduledTweetJob {
  id: string;
  user_id: string;
  content: string;
  scheduled_for: Date;
  attempts: number;
  max_attempts: number;
}

// Twitter API error types
export interface TwitterAPIError {
  type: string;
  title: string;
  detail: string;
  status: number;
}

// Tweet status enum for better type safety
export type TweetStatus = 'draft' | 'completed' | 'scheduled' | 'sent';

// Tweet with Twitter-specific fields
export interface TweetWithTwitterData {
  id: string;
  user_id: string;
  content: string;
  status: TweetStatus;
  scheduled_for?: Date | null;
  tweet_id?: string | null;
  sent_at?: Date | null;
  error_message?: string | null;
  created_at: Date;
  updated_at: Date;
  // Optional Twitter data (when available)
  twitter_data?: {
    user: TwitterUser;
    metrics?: TwitterTweet['public_metrics'];
  };
}

// User with Twitter connection status
export interface UserWithTwitter {
  id: string;
  email: string;
  twitter_connected: boolean;
  twitter_username?: string;
  twitter_user_id?: string;
}

// Tweet scheduling options
export interface TweetScheduleOptions {
  immediate: boolean;
  scheduled_time?: Date;
  timezone?: string;
}

// Twitter connection status
export interface TwitterConnectionStatus {
  connected: boolean;
  username?: string;
  user_id?: string;
  expires_at?: Date;
  needs_refresh?: boolean;
}
