import { authOptions } from '@/lib/auth/auth';
import { TwitterOAuth } from '@/lib/twitter/oauth';
import { TwitterTokenManager } from '@/lib/twitter/token-manager';
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

    // Get tokens directly without aggressive validation
    const tokens = await TwitterOAuth.getUserTokens(userId);
    
    if (!tokens) {
      return NextResponse.json({
        success: true,
        isConnected: false,
        user: null,
      });
    }

    // Get user info from stored data
    const userInfo = await TwitterOAuth.getTwitterUserInfo(userId);
    
    console.log('=== TWITTER STATUS CHECK ===');
    console.log('Found tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      accessTokenLength: tokens.access_token?.length,
      twitterUserId: tokens.twitter_user_id,
      twitterUsername: tokens.twitter_username
    });

    // Try to validate tokens but don't fail if validation fails
    try {
      const validation = await TwitterTokenManager.validateTokens(tokens);
      console.log('Token validation result:', validation);
      
      return NextResponse.json({
        success: true,
        isConnected: validation.isValid,
        user: userInfo || undefined,
        tokenExpiry: tokens.expires_at,
        lastVerified: new Date(),
        validation: validation
      });
    } catch (error) {
      console.error('Token validation error:', error);
      
      // Return connected but with validation error
      return NextResponse.json({
        success: true,
        isConnected: false,
        user: userInfo || undefined,
        tokenExpiry: tokens.expires_at,
        lastVerified: new Date(),
        validationError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('--- UNCAUGHT ERROR in /api/twitter/status ---');
    console.error(error);
    console.error('-------------------------------------------');
    return NextResponse.json(
      {
        success: false,
        isConnected: false,
        error: 'Failed to check Twitter connection status.',
      },
      { status: 500 }
    );
  }
}

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Invalidate tokens and force a re-check and potential refresh
    const tokens = await TwitterTokenManager.getValidTokens(userId);

    if (!tokens) {
      return NextResponse.json({
        success: true,
        isConnected: false,
        user: null,
        message: 'No Twitter connection found to refresh.',
      });
    }
    
    // The getValidTokens method already handles refresh logic. 
    // We just need to get updated user info.
    const connectionStatus = await TwitterTokenManager.getConnectionStatus(
      userId
    );

    return NextResponse.json({
      success: true,
      ...connectionStatus,
      message: 'Twitter connection status refreshed.',
    });

  } catch (error) {
    console.error('--- UNCAUGHT ERROR in /api/twitter/status POST ---');
    console.error(error);
    console.error('----------------------------------------------------');
    return NextResponse.json(
      {
        success: false,
        isConnected: false,
        error: 'Failed to refresh Twitter connection status.',
      },
      { status: 500 }
    );
  }
}
