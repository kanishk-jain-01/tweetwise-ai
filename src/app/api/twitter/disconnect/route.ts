import { authOptions } from '@/lib/auth/auth';
import { TwitterQueries } from '@/lib/database/twitter-queries';
import { TwitterTokenManager } from '@/lib/twitter/token-manager';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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

    // Check if user has Twitter connection
    const tokens = await tokenManager.getValidTokens(userId);
    
    if (!tokens) {
      return NextResponse.json({
        success: true,
        message: 'No Twitter connection found to disconnect',
      });
    }

    // Delete Twitter tokens
    await tokenManager.deleteTokens(userId);

    // Clear user's Twitter information from database
    await twitterQueries.clearUserTwitterInfo(userId);

    // Update any scheduled tweets to draft status (optional - keep them as drafts)
    await twitterQueries.convertScheduledTweetsToDrafts(userId);

    return NextResponse.json({
      success: true,
      message: 'Twitter account disconnected successfully',
    });

  } catch (error) {
    console.error('Twitter disconnect error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect Twitter account',
        code: 'DISCONNECT_ERROR',
      },
      { status: 500 }
    );
  }
}

// GET method to check disconnect status (for UI confirmation)
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

    // Get current connection status
    const tokens = await tokenManager.getValidTokens(userId);
    const userTwitterInfo = await twitterQueries.getUserTwitterInfo(userId);
    
    // Count scheduled tweets that would be affected
    const scheduledTweetsCount = await twitterQueries.getScheduledTweetsCount(userId);

    return NextResponse.json({
      success: true,
      data: {
        isConnected: !!tokens,
        user: userTwitterInfo ? {
          username: userTwitterInfo.twitter_username,
          name: userTwitterInfo.twitter_display_name,
        } : null,
        scheduledTweetsCount,
        disconnectWarning: scheduledTweetsCount > 0 
          ? `You have ${scheduledTweetsCount} scheduled tweet(s) that will be converted to drafts.`
          : null,
      },
    });

  } catch (error) {
    console.error('Twitter disconnect status check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check disconnect status',
        code: 'DISCONNECT_STATUS_ERROR',
      },
      { status: 500 }
    );
  }
} 