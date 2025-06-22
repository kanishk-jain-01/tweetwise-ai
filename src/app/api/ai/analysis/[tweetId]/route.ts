import { authOptions } from '@/lib/auth/auth';
import { AIResponseQueries } from '@/lib/database/ai-queries';
import { TweetQueries, UserQueries } from '@/lib/database/queries';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for query parameters
const analysisQuerySchema = z.object({
  type: z.enum(['spelling', 'grammar', 'critique', 'curation']).optional(),
});

interface RouteContext {
  params: Promise<{
    tweetId: string;
  }>;
}

/**
 * GET /api/ai/analysis/[tweetId]
 * Retrieve analysis history for a specific tweet
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tweetId } = await params;

    // Validate tweetId format
    if (!tweetId || typeof tweetId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid tweet ID provided' },
        { status: 400 }
      );
    }

    // Verify user owns the tweet
    const user = await UserQueries.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasOwnership = await TweetQueries.verifyOwnership(tweetId, user.id);
    if (!hasOwnership) {
      return NextResponse.json(
        { error: 'Tweet not found or access denied' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = {
      type: url.searchParams.get('type'),
      limit: url.searchParams.get('limit'),
    };

    const validation = analysisQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { type } = validation.data;

    try {
      if (type) {
        // Get analysis for specific type
        const analysis = await AIResponseQueries.getAnalysis(tweetId, type);

        return NextResponse.json({
          success: true,
          data: {
            tweetId,
            type,
            analysis,
          },
        });
      } else {
        // Get all available analysis types and their data
        const availableTypes =
          await AIResponseQueries.getAvailableAnalysisTypes(tweetId);

        // Get analysis for each available type
        const analysisPromises = availableTypes.map(async analysisType => {
          const analysis = await AIResponseQueries.getAnalysis(
            tweetId,
            analysisType as any
          );
          return { type: analysisType, analysis };
        });

        const analyses = await Promise.all(analysisPromises);
        const analysesByType = Object.fromEntries(
          analyses.map(({ type, analysis }) => [type, analysis])
        );

        return NextResponse.json({
          success: true,
          data: {
            tweetId,
            availableTypes,
            analyses: analysesByType,
          },
        });
      }
    } catch (dbError) {
      console.error('Database error retrieving analysis:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve analysis data',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Analysis history API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while retrieving analysis history',
        code: 'ANALYSIS_HISTORY_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/analysis/[tweetId]
 * Delete all analysis data for a tweet (cleanup when tweet is deleted)
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tweetId } = await params;

    // Validate tweetId format
    if (!tweetId || typeof tweetId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid tweet ID provided' },
        { status: 400 }
      );
    }

    // Verify user owns the tweet
    const user = await UserQueries.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasOwnership = await TweetQueries.verifyOwnership(tweetId, user.id);
    if (!hasOwnership) {
      return NextResponse.json(
        { error: 'Tweet not found or access denied' },
        { status: 403 }
      );
    }

    try {
      const deletedCount =
        await AIResponseQueries.deleteAnalysisForTweet(tweetId);

      return NextResponse.json({
        success: true,
        data: {
          tweetId,
          deletedVersions: deletedCount,
        },
      });
    } catch (dbError) {
      console.error('Database error deleting analysis:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete analysis data',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Analysis deletion API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while deleting analysis data',
        code: 'ANALYSIS_DELETION_ERROR',
      },
      { status: 500 }
    );
  }
}
