import { authOptions } from '@/lib/auth/auth';
import { TwitterQueries } from '@/lib/database/twitter-queries';
import { TwitterTokenManager } from '@/lib/twitter/token-manager';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const scheduleTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(280, 'Tweet content cannot exceed 280 characters'),
  scheduledFor: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format.')
    .refine(
      date => new Date(date) > new Date(),
      'Scheduled time must be in the future'
    )
    .refine(
      date =>
        new Date(date) <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      'Scheduled time cannot be more than 1 year in the future'
    ),
  tweetId: z.string().uuid().optional(), // Optional draft tweet ID to update
});

// Update scheduled tweet schema
const updateScheduledTweetSchema = z.object({
  tweetId: z.string().uuid(),
  action: z.enum(['update', 'cancel']).optional().default('update'),
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(280, 'Tweet content cannot exceed 280 characters')
    .optional(),
  scheduledFor: z
    .string()
    .datetime('Invalid date format. Use ISO 8601 format.')
    .refine(
      date => new Date(date) > new Date(),
      'Scheduled time must be in the future'
    )
    .refine(
      date =>
        new Date(date) <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      'Scheduled time cannot be more than 1 year in the future'
    )
    .optional(),
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

    const validation = scheduleTweetSchema.safeParse(body);
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

    const { content, scheduledFor, tweetId } = validation.data;
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

    // Convert scheduled time to Date object
    const scheduledDate = new Date(scheduledFor);

    // Create or update tweet record in database
    const twitterQueries = new TwitterQueries();
    let dbTweet;

    if (tweetId) {
      // Update existing draft tweet
      dbTweet = await twitterQueries.updateTweetStatus(
        tweetId,
        userId,
        'scheduled',
        {
          content,
          scheduledFor: scheduledDate,
          errorMessage: null,
        }
      );
    } else {
      // Create new scheduled tweet record
      dbTweet = await twitterQueries.createTweet({
        userId,
        content,
        status: 'scheduled',
        scheduledFor: scheduledDate,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        dbTweetId: dbTweet.id,
        content: dbTweet.content,
        scheduledFor: dbTweet.scheduled_for,
        status: dbTweet.status,
      },
      message: 'Tweet scheduled successfully',
    });
  } catch (error) {
    console.error('Tweet scheduling API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while scheduling tweet',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve scheduled tweets
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
    const includeExpired = searchParams.get('include_expired') === 'true';

    // Get scheduled tweets from database
    const twitterQueries = new TwitterQueries();
    const scheduledTweets = await twitterQueries.getScheduledTweets(
      userId,
      limit,
      offset,
      includeExpired
    );

    return NextResponse.json({
      success: true,
      data: {
        tweets: scheduledTweets,
        pagination: {
          limit,
          offset,
          hasMore: scheduledTweets.length === limit,
        },
      },
    });
  } catch (error) {
    console.error('Get scheduled tweets API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve scheduled tweets',
        code: 'RETRIEVAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// PUT method to update scheduled tweets
export async function PUT(req: NextRequest) {
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

    const validation = updateScheduledTweetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

        const { tweetId, action, content, scheduledFor } = validation.data;
    const userId = session.user.id;

    // Update scheduled tweet
    const twitterQueries = new TwitterQueries();
    let dbTweet;

    if (action === 'cancel') {
      // Cancel scheduled tweet by converting it to draft
      dbTweet = await twitterQueries.updateTweetStatus(
        tweetId,
        userId,
        'draft',
        {
          scheduledFor: null,
          errorMessage: null,
        }
      );

      if (!dbTweet) {
        return NextResponse.json(
          {
            success: false,
            error: 'Scheduled tweet not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          dbTweetId: dbTweet.id,
          content: dbTweet.content,
          status: dbTweet.status,
        },
        message: 'Scheduled tweet cancelled and converted to draft',
      });
    } else {
      // Update scheduled tweet
      const updateData: any = {};

      if (content !== undefined) {
        updateData.content = content;
      }

      if (scheduledFor !== undefined) {
        updateData.scheduledFor = new Date(scheduledFor);
      }

      dbTweet = await twitterQueries.updateTweetStatus(
        tweetId,
        userId,
        'scheduled',
        updateData
      );

      if (!dbTweet) {
        return NextResponse.json(
          {
            success: false,
            error: 'Scheduled tweet not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          dbTweetId: dbTweet.id,
          content: dbTweet.content,
          scheduledFor: dbTweet.scheduled_for,
          status: dbTweet.status,
        },
        message: 'Scheduled tweet updated successfully',
      });
    }
  } catch (error) {
    console.error('Update scheduled tweet API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while updating scheduled tweet',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// DELETE method to cancel scheduled tweets
export async function DELETE(req: NextRequest) {
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
    const tweetId = searchParams.get('tweetId');

    if (!tweetId) {
      return NextResponse.json(
        { success: false, error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    // Delete scheduled tweet
    const twitterQueries = new TwitterQueries();
    const deleted = await twitterQueries.deleteScheduledTweet(tweetId, userId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scheduled tweet not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled tweet cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel scheduled tweet API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while cancelling scheduled tweet',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
