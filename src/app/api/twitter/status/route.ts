import { authOptions } from '@/lib/auth/auth';
import { TwitterQueries } from '@/lib/database/twitter-queries';
import { createAuthenticatedTwitterClient } from '@/lib/twitter/client';
import { TwitterTokenManager } from '@/lib/twitter/token-manager';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const tokenManager = new TwitterTokenManager();
    const twitterQueries = new TwitterQueries();

    // Check if user has valid Twitter tokens
    const tokens = await tokenManager.getValidTokens(userId);
    
    if (!tokens) {
      return NextResponse.json({
        success: true,
        isConnected: false,
        user: null,
      });
    }

    // Get user's Twitter information from database
    const userTwitterInfo = await twitterQueries.getUserTwitterInfo(userId);
    
    if (!userTwitterInfo) {
      // Tokens exist but no user info - try to fetch from Twitter API
      try {
        const twitterClient = createAuthenticatedTwitterClient(
          tokens.accessToken,
          tokens.refreshToken || ''
        );
        
        const twitterUser = await twitterClient.verifyCredentials();
        
        // Update database with fresh user info
        await twitterQueries.updateUserTwitterInfo(userId, {
          twitterUserId: twitterUser.id,
          twitterUsername: twitterUser.username,
          twitterDisplayName: twitterUser.name,
        });

        return NextResponse.json({
          success: true,
          isConnected: true,
          user: {
            id: twitterUser.id,
            username: twitterUser.username,
            name: twitterUser.name,
            verified: twitterUser.verified,
            followersCount: twitterUser.followersCount,
            followingCount: twitterUser.followingCount,
            tweetCount: twitterUser.tweetCount,
          },
        });
      } catch (error) {
        console.error('Failed to verify Twitter credentials:', error);
        
        // Tokens might be invalid - clean them up
        await tokenManager.deleteTokens(userId);
        
        return NextResponse.json({
          success: true,
          isConnected: false,
          user: null,
          error: 'Twitter tokens are invalid or expired',
        });
      }
    }

    // Return cached user information
    return NextResponse.json({
      success: true,
      isConnected: true,
      user: {
        id: userTwitterInfo.twitter_user_id,
        username: userTwitterInfo.twitter_username,
        name: userTwitterInfo.twitter_display_name,
      },
    });

  } catch (error) {
    console.error('Twitter status check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check Twitter connection status',
        code: 'STATUS_CHECK_ERROR',
      },
      { status: 500 }
    );
  }
}

// POST method to refresh Twitter connection status
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const tokenManager = new TwitterTokenManager();
    const twitterQueries = new TwitterQueries();

    // Check if user has valid Twitter tokens
    const tokens = await tokenManager.getValidTokens(userId);
    
    if (!tokens) {
      return NextResponse.json({
        success: true,
        isConnected: false,
        user: null,
        message: 'No Twitter connection found',
      });
    }

    try {
      // Force refresh user information from Twitter API
      const twitterClient = createAuthenticatedTwitterClient(
        tokens.accessToken,
        tokens.refreshToken || ''
      );
      
      const twitterUser = await twitterClient.verifyCredentials();
      
      // Update database with fresh user info
      await twitterQueries.updateUserTwitterInfo(userId, {
        twitterUserId: twitterUser.id,
        twitterUsername: twitterUser.username,
        twitterDisplayName: twitterUser.name,
      });

      return NextResponse.json({
        success: true,
        isConnected: true,
        user: {
          id: twitterUser.id,
          username: twitterUser.username,
          name: twitterUser.name,
          verified: twitterUser.verified,
          followersCount: twitterUser.followersCount,
          followingCount: twitterUser.followingCount,
          tweetCount: twitterUser.tweetCount,
        },
        message: 'Twitter connection refreshed successfully',
      });

    } catch (error) {
      console.error('Failed to refresh Twitter credentials:', error);
      
      // Tokens might be invalid - clean them up
      await tokenManager.deleteTokens(userId);
      await twitterQueries.clearUserTwitterInfo(userId);
      
      return NextResponse.json({
        success: true,
        isConnected: false,
        user: null,
        error: 'Twitter tokens are invalid or expired',
        message: 'Twitter connection has been removed due to invalid credentials',
      });
    }

  } catch (error) {
    console.error('Twitter status refresh error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh Twitter connection status',
        code: 'STATUS_REFRESH_ERROR',
      },
      { status: 500 }
    );
  }
} 