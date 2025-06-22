import { generateImage, getImageFormatFromBase64, validateImageRequest } from '@/lib/ai/image-generation';
import { authOptions } from '@/lib/auth/auth';
import { ImageQueries } from '@/lib/database/image-queries';
import type { ImageGenerationRequest } from '@/lib/database/schema';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: userLimit.resetTime };
  }

  // Increment count
  userLimit.count += 1;
  rateLimitStore.set(userId, userLimit);
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateCheck = checkRateLimit(session.user.email);
    if (!rateCheck.allowed) {
      const resetTimeSeconds = rateCheck.resetTime ? Math.ceil((rateCheck.resetTime - Date.now()) / 1000) : 60;
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many image generation requests. Try again in ${resetTimeSeconds} seconds.`,
          resetTime: rateCheck.resetTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': resetTimeSeconds.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateCheck.resetTime?.toString() || '',
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { tweetContent, tweetId, style, size, quality } = body;

    // Validate required fields
    if (!tweetContent || typeof tweetContent !== 'string') {
      return NextResponse.json(
        { error: 'Tweet content is required' },
        { status: 400 }
      );
    }

    if (!style || !['ghibli', 'photo_realistic'].includes(style)) {
      return NextResponse.json(
        { error: 'Valid style is required (ghibli or photo_realistic)' },
        { status: 400 }
      );
    }

    // Prepare image generation request
    const imageRequest: ImageGenerationRequest = {
      prompt: tweetContent,
      style,
      size: size || '1024x1024',
      format: 'png', // DALL-E 3 default
      quality: quality || 'medium',
    };

    // Validate the request
    const validation = validateImageRequest(imageRequest);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    console.log('Generating image for user:', session.user.email, 'Style:', style);

    // Generate the image
    const result = await generateImage(imageRequest);

    // Determine image format
    const format = getImageFormatFromBase64(result.base64Data);

    // If tweetId is provided, save the image to database
    let savedImage = null;
    if (tweetId && typeof tweetId === 'string') {
      try {
        savedImage = await ImageQueries.saveImage({
          tweet_id: tweetId,
          base64_data: result.base64Data,
          prompt: result.prompt,
          style,
          size: imageRequest.size || '1024x1024',
          format,
          quality: imageRequest.quality || 'medium',
          generation_time_ms: result.generationTimeMs,
          file_size_bytes: result.fileSizeBytes,
        });
        console.log('Image saved to database with ID:', savedImage.id);
      } catch (dbError) {
        console.error('Failed to save image to database:', dbError);
        // Continue without saving - return the generated image anyway
      }
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      image: {
        id: savedImage?.id || null,
        base64Data: result.base64Data,
        prompt: result.prompt,
        style,
        size: imageRequest.size || '1024x1024',
        format,
        quality: imageRequest.quality || 'medium',
        generationTimeMs: result.generationTimeMs,
        fileSizeBytes: result.fileSizeBytes,
        savedToDatabase: !!savedImage,
      },
      metadata: {
        generationTime: `${result.generationTimeMs}ms`,
        fileSize: `${Math.round(result.fileSizeBytes / 1024)}KB`,
        dimensions: imageRequest.size || '1024x1024',
        style: style,
      }
    });

  } catch (error) {
    console.error('Image generation API error:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        return NextResponse.json(
          { 
            error: 'Content Policy Violation',
            message: 'The content violates OpenAI\'s usage policies. Please try a different prompt.'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json(
          { 
            error: 'OpenAI Rate Limit',
            message: 'OpenAI API rate limit exceeded. Please try again later.'
          },
          { status: 429 }
        );
      }

      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { 
            error: 'API Quota Exceeded',
            message: 'OpenAI API quota has been exceeded. Please check your account.'
          },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Image Generation Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during image generation.'
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 