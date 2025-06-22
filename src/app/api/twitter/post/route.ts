import { authOptions } from '@/lib/auth/auth';
import { ImageQueries } from '@/lib/database/image-queries';
import { TwitterQueries } from '@/lib/database/twitter-queries';
import { createAuthenticatedTwitterClient } from '@/lib/twitter/client';
import { TwitterTokenManager } from '@/lib/twitter/token-manager';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const postTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(280, 'Tweet content cannot exceed 280 characters'),
  tweetId: z.string().uuid().optional(), // Optional draft tweet ID to update
});

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

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = postTweetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tweet data',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { content, tweetId } = validation.data;
    const userId = session.user.id;

    // Check if user has valid Twitter tokens
    const tokenManager = new TwitterTokenManager();
    const tokens = await tokenManager.getValidTokens(userId);

    if (!tokens) {
      return NextResponse.json(
        {
          success: false,
          error: 'Twitter account not connected',
          code: 'NOT_CONNECTED',
        },
        { status: 403 }
      );
    }

    // Create authenticated Twitter client
    const twitterClient = createAuthenticatedTwitterClient(
      tokens.access_token,
      tokens.refresh_token || ''
    );

    // Check if tweet has an associated image
    let associatedImage = null;
    if (tweetId) {
      try {
        associatedImage = await ImageQueries.getImageByTweetId(tweetId);
      } catch (error) {
        console.warn('Failed to check for associated image:', error);
        // Continue without image if database check fails
      }
    }

    // Post tweet to Twitter (with or without media)
    let twitterResponse;
    try {
      if (associatedImage) {
        // Upload media first, then post tweet with media
        console.log('Uploading image to Twitter for tweet...');
        const mediaUpload = await twitterClient.uploadMedia(
          associatedImage.base64_data,
          `AI-generated image: ${associatedImage.prompt.substring(0, 100)}...`
        );
        
        console.log('Image uploaded successfully, posting tweet with media...');
        twitterResponse = await twitterClient.postTweetWithMedia(content, [mediaUpload.media_id_string]);
      } else {
        // Post text-only tweet
        twitterResponse = await twitterClient.postTweet(content);
      }
    } catch (error) {
      console.error('Failed to post tweet to Twitter:', error);

      // Handle specific Twitter API errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          return NextResponse.json(
            {
              success: false,
              error: 'This tweet appears to be a duplicate',
              code: 'DUPLICATE_TWEET',
            },
            { status: 409 }
          );
        }

        if (error.message.includes('rate limit')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Twitter rate limit exceeded. Please try again later.',
              code: 'RATE_LIMITED',
            },
            { status: 429 }
          );
        }

        if (error.message.includes('Image is too large') || error.message.includes('5MB')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Image is too large. Twitter supports images up to 5MB.',
              code: 'IMAGE_TOO_LARGE',
            },
            { status: 413 }
          );
        }

        if (error.message.includes('Unsupported image format') || error.message.includes('format')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP.',
              code: 'UNSUPPORTED_IMAGE_FORMAT',
            },
            { status: 400 }
          );
        }

        if (error.message.includes('media upload') || error.message.includes('Failed to upload')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to upload image to Twitter. Please try again.',
              code: 'MEDIA_UPLOAD_FAILED',
            },
            { status: 500 }
          );
        }

        if (error.message.includes('media.write') || error.message.includes('scope') || 
            error.message.includes('disconnect and reconnect')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing media upload permission. Please disconnect and reconnect your Twitter account to get the required permissions.',
              code: 'MISSING_MEDIA_SCOPE',
              action: 'reconnect_twitter',
            },
            { status: 403 }
          );
        }
      }

      // Update tweet with error status if we have a tweetId
      if (tweetId) {
        const twitterQueries = new TwitterQueries();
        await twitterQueries.updateTweetStatus(tweetId, userId, 'draft', {
          errorMessage:
            error instanceof Error ? error.message : 'Failed to post tweet',
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to post tweet to Twitter',
          code: 'TWITTER_API_ERROR',
        },
        { status: 500 }
      );
    }

    // Update or create tweet record in database
    const twitterQueries = new TwitterQueries();
    let dbTweet;

    if (tweetId) {
      // Update existing draft tweet
      dbTweet = await twitterQueries.updateTweetStatus(
        tweetId,
        userId,
        'sent',
        {
          tweetId: twitterResponse.id,
          sentAt: new Date(),
          errorMessage: null,
        }
      );
    } else {
      // Create new tweet record
      dbTweet = await twitterQueries.createTweet({
        userId,
        content,
        status: 'sent',
        tweetId: twitterResponse.id,
        sentAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        tweetId: twitterResponse.id,
        text: twitterResponse.text,
        dbTweetId: dbTweet.id,
        sentAt: dbTweet.sent_at,
        hasMedia: !!associatedImage,
        mediaInfo: associatedImage ? {
          style: associatedImage.style,
          prompt: associatedImage.prompt,
          size: associatedImage.size,
        } : null,
      },
      message: associatedImage 
        ? 'Tweet with image posted successfully to Twitter'
        : 'Tweet posted successfully to Twitter',
    });
  } catch (error) {
    console.error('Tweet posting API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while posting tweet',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve posting status/history
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
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Get sent tweets from database
    const twitterQueries = new TwitterQueries();
    const sentTweets = await twitterQueries.getSentTweets(
      userId,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: {
        tweets: sentTweets,
        pagination: {
          limit,
          offset,
          hasMore: sentTweets.length === limit,
        },
      },
    });
  } catch (error) {
    console.error('Get sent tweets API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve sent tweets',
        code: 'RETRIEVAL_ERROR',
      },
      { status: 500 }
    );
  }
}
