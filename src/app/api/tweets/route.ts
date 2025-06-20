import { authOptions } from '@/lib/auth/auth';
import { UserQueries } from '@/lib/database/queries';
import { TweetQueries } from '@/lib/database/tweet-queries';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tweets - Fetch user's tweets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First get user ID from email
    const user = await UserQueries.findByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const tweets = await TweetQueries.findByUserId(user.id);

    return NextResponse.json({
      success: true,
      tweets,
    });
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tweets - Create or update a tweet/draft
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, status = 'draft', id } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { success: false, error: 'Content exceeds 280 characters' },
        { status: 400 }
      );
    }

    // Get user ID from email
    const user = await UserQueries.findByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let tweet;
    if (id) {
      // Update existing tweet
      tweet = await TweetQueries.update(id, { content: content.trim(), status });
    } else {
      // Create new tweet
      tweet = await TweetQueries.create({
        user_id: user.id,
        content: content.trim(),
        status
      });
    }

    return NextResponse.json({
      success: true,
      tweet,
    });
  } catch (error) {
    console.error('Error creating/updating tweet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tweets/[id] - Delete a tweet
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership before deletion
    const user = await UserQueries.findByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const hasOwnership = await TweetQueries.verifyOwnership(id, user.id);
    if (!hasOwnership) {
      return NextResponse.json(
        { success: false, error: 'Tweet not found or access denied' },
        { status: 404 }
      );
    }

    await TweetQueries.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Tweet deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 