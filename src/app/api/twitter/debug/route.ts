import { authOptions } from '@/lib/auth/auth';
import { createAuthenticatedTwitterClient } from '@/lib/twitter/client';
import { TwitterOAuth } from '@/lib/twitter/oauth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('=== TWITTER OAUTH DEBUG ===');
    console.log('User ID:', userId);

    // Step 1: Check if tokens exist in database
    const tokens = await TwitterOAuth.getUserTokens(userId);
    console.log('Tokens from DB:', {
      hasTokens: !!tokens,
      accessTokenLength: tokens?.access_token?.length,
      refreshTokenLength: tokens?.refresh_token?.length,
      accessTokenPrefix: tokens?.access_token?.substring(0, 20) + '...',
      twitterUserId: tokens?.twitter_user_id,
      twitterUsername: tokens?.twitter_username,
      createdAt: tokens?.created_at,
    });

    if (!tokens) {
      return NextResponse.json({
        success: false,
        error: 'No tokens found in database',
        debug: { step: 'token_retrieval', userId }
      });
    }

    // Step 2: Check token format
    if (!tokens.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Access token is null/undefined in database',
        debug: { 
          step: 'token_format_check', 
          userId,
          tokenData: {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            twitterUserId: tokens.twitter_user_id,
            twitterUsername: tokens.twitter_username
          }
        }
      });
    }

    const isValidFormat = tokens.access_token.startsWith('Bearer ') || 
                         tokens.access_token.match(/^[A-Za-z0-9\-_]+$/);
    console.log('Token format check:', {
      accessTokenFormat: isValidFormat ? 'valid' : 'invalid',
      startsWithBearer: tokens.access_token.startsWith('Bearer '),
      tokenPattern: tokens.access_token.match(/^[A-Za-z0-9\-_]+$/) ? 'alphanumeric' : 'other'
    });

    // Step 3: Try to create client and make API call
    try {
      console.log('Creating Twitter client...');
      const client = createAuthenticatedTwitterClient(
        tokens.access_token,
        tokens.refresh_token || undefined
      );

      console.log('Making API call to verify credentials...');
      const userInfo = await client.verifyCredentials();
      
      console.log('API call successful:', {
        id: userInfo.id,
        username: userInfo.username,
        name: userInfo.name
      });

      return NextResponse.json({
        success: true,
        message: 'Twitter connection is working correctly',
        debug: {
          step: 'api_call_success',
          userInfo: {
            id: userInfo.id,
            username: userInfo.username,
            name: userInfo.name
          }
        }
      });

    } catch (apiError: any) {
      console.error('API call failed:', {
        error: apiError.message,
        data: apiError.data,
        status: apiError.status,
        code: apiError.code
      });

      // Check if it's a specific Twitter API error
      const errorDetails = {
        message: apiError.message,
        status: apiError.status,
        code: apiError.code,
        data: apiError.data,
        type: 'unknown'
      };

      if (apiError.data?.detail) {
        errorDetails.type = 'twitter_api_error';
      } else if (apiError.message?.includes('unauthorized')) {
        errorDetails.type = 'unauthorized';
      } else if (apiError.message?.includes('rate limit')) {
        errorDetails.type = 'rate_limit';
      }

      return NextResponse.json({
        success: false,
        error: 'Twitter API call failed',
                  debug: {
            step: 'api_call_failed',
            tokenInfo: {
              hasAccessToken: !!tokens.access_token,
              hasRefreshToken: !!tokens.refresh_token,
              accessTokenLength: tokens.access_token.length,
              accessTokenPrefix: tokens.access_token.substring(0, 20) + '...'
            },
            apiError: errorDetails
          }
      });
    }

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Debug endpoint failed',
        debug: {
          step: 'debug_endpoint_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
} 