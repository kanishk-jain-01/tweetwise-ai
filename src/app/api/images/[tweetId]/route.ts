import { authOptions } from '@/lib/auth/auth';
import { ImageQueries } from '@/lib/database/image-queries';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/images/[tweetId] - Get image for a specific tweet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tweetId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { tweetId } = await params;

    if (!tweetId || typeof tweetId !== 'string') {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    // Get image for the tweet
    const image = await ImageQueries.getImageByTweetId(tweetId);

    if (!image) {
      return NextResponse.json(
        { error: 'No image found for this tweet' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });

  } catch (error) {
    console.error('Get image API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve image'
      },
      { status: 500 }
    );
  }
}

