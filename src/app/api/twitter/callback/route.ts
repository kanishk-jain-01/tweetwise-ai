import { authOptions } from '@/lib/auth/auth';
import { TwitterQueries } from '@/lib/database/twitter-queries';
import { TwitterClient } from '@/lib/twitter/client';
import { TwitterOAuth } from '@/lib/twitter/oauth';
import { TwitterTokenManager } from '@/lib/twitter/token-manager';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Twitter OAuth error:', error, errorDescription);

      // Redirect to dashboard with error
      const dashboardUrl = new URL('/dashboard', req.url);
      dashboardUrl.searchParams.set('twitter_error', error);
      dashboardUrl.searchParams.set(
        'twitter_error_description',
        errorDescription || 'Unknown error'
      );

      return NextResponse.redirect(dashboardUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing required OAuth parameters:', {
        code: !!code,
        state: !!state,
      });

      const dashboardUrl = new URL('/dashboard', req.url);
      dashboardUrl.searchParams.set('twitter_error', 'invalid_request');
      dashboardUrl.searchParams.set(
        'twitter_error_description',
        'Missing authorization code or state'
      );

      return NextResponse.redirect(dashboardUrl);
    }

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('User not authenticated during OAuth callback');

      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('error', 'authentication_required');

      return NextResponse.redirect(loginUrl);
    }

    const userId = session.user.id;
    const tokenManager = new TwitterTokenManager();

    // Retrieve and validate OAuth state
    const oauthState = await tokenManager.getOAuthState(userId, state);
    if (!oauthState) {
      console.error('Invalid or expired OAuth state:', state);

      const dashboardUrl = new URL('/dashboard', req.url);
      dashboardUrl.searchParams.set('twitter_error', 'invalid_state');
      dashboardUrl.searchParams.set(
        'twitter_error_description',
        'Invalid or expired authentication state'
      );

      return NextResponse.redirect(dashboardUrl);
    }

    // Create Twitter client and exchange code for tokens
    const twitterClient = new TwitterClient();
    const tokenData = await twitterClient.exchangeCodeForTokens(
      code,
      oauthState.codeVerifier
    );

    // Test the tokens immediately after receiving them from Twitter
    console.log('=== TESTING TOKENS IMMEDIATELY AFTER OAUTH ===');
    try {
      const testClient = new TwitterClient(tokenData.accessToken, tokenData.refreshToken || undefined);
      const testUser = await testClient.verifyCredentials();
      console.log('✅ Tokens work immediately after OAuth:', {
        id: testUser.id,
        username: testUser.username,
        name: testUser.name
      });
    } catch (testError: any) {
      console.error('❌ Tokens fail immediately after OAuth:', {
        error: testError.message,
        data: testError.data,
        status: testError.status
      });
    }

    // Store the tokens directly without validation to avoid premature disconnection
    const storedTokens = await TwitterOAuth.storeUserTokens({
      userId,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken || null,
      twitterUserId: tokenData.user.id,
      twitterUsername: tokenData.user.username,
      twitterName: tokenData.user.name,
    });
    
    console.log('✅ Tokens stored in database:', {
      hasTokens: !!storedTokens,
      accessTokenLength: storedTokens?.access_token?.length,
      twitterUserId: storedTokens?.twitter_user_id,
      twitterUsername: storedTokens?.twitter_username
    });

    // Store user information
    const twitterQueries = new TwitterQueries();
    await twitterQueries.updateUserTwitterInfo(userId, {
      twitterUserId: tokenData.user.id,
      twitterUsername: tokenData.user.username,
      twitterName: tokenData.user.name,
    });

    // Clean up OAuth state
    await tokenManager.cleanupOAuthState(userId, state);

    // Redirect to dashboard with success
    const dashboardUrl = new URL('/dashboard', req.url);
    dashboardUrl.searchParams.set('twitter_connected', 'true');
    dashboardUrl.searchParams.set('twitter_username', tokenData.user.username);

    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);

    // Redirect to dashboard with error
    const dashboardUrl = new URL('/dashboard', req.url);
    dashboardUrl.searchParams.set('twitter_error', 'callback_error');
    dashboardUrl.searchParams.set(
      'twitter_error_description',
      error instanceof Error
        ? error.message
        : 'Failed to complete Twitter authentication'
    );

    return NextResponse.redirect(dashboardUrl);
  }
}

// Handle POST requests (in case the callback comes as POST)
export async function POST(req: NextRequest) {
  // Twitter OAuth callbacks are typically GET requests,
  // but we'll handle POST as well for completeness
  return GET(req);
}
