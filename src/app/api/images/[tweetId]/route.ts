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

// PATCH /api/images/[imageId] - Update image with tweet association
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { tweet_id } = body;

    // The route parameter is actually imageId for PATCH requests
    const resolvedParams = await params;
    const imageId = resolvedParams.tweetId; // This is confusing but it's the image ID for PATCH

    if (!imageId || typeof imageId !== 'string') {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Update the image with new tweet association
    const updatedImage = await ImageQueries.updateImage(imageId, {
      tweet_id,
    });

    if (!updatedImage) {
      return NextResponse.json(
        { error: 'Image not found or could not be updated' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image: updatedImage,
      message: 'Image association updated successfully',
    });

  } catch (error) {
    console.error('Update image API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to update image association'
      },
      { status: 500 }
    );
  }
} 