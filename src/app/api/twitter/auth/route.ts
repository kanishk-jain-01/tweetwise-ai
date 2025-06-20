import { authOptions } from '@/lib/auth/auth';
import { TwitterClient } from '@/lib/twitter/client';
import { TwitterTokenManager } from '@/lib/twitter/token-manager';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const authRequestSchema = z.object({
  state: z.string().optional(),
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
      body = {}; // Default to empty object if no body
    }

    const validation = authRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validation.error.flatten()
        },
        { status: 400 }
      );
    }

    const { state } = validation.data;
    const userId = session.user.id;

    // Check if user already has a valid Twitter connection
    const tokenManager = new TwitterTokenManager();
    const existingConnection = await tokenManager.getValidTokens(userId);
    
    if (existingConnection) {
      return NextResponse.json({
        success: false,
        error: 'Twitter account already connected',
        code: 'ALREADY_CONNECTED'
      }, { status: 409 });
    }

    // Create Twitter client for OAuth initiation
    const twitterClient = new TwitterClient();
    
    // Generate OAuth authorization URL
    const oauthData = await twitterClient.generateAuthLink(state || `user_${userId}_${Date.now()}`);
    
    // Store the OAuth state and code verifier temporarily
    await tokenManager.storeOAuthState(userId, {
      state: oauthData.state,
      codeVerifier: oauthData.codeVerifier,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return NextResponse.json({
      success: true,
      authUrl: oauthData.authUrl,
      state: oauthData.state,
    });

  } catch (error) {
    console.error('Twitter auth initiation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate Twitter authentication',
        code: 'AUTH_INIT_ERROR',
      },
      { status: 500 }
    );
  }
}

// GET method to check current auth status
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
    
    // Check if user has valid Twitter tokens
    const tokens = await tokenManager.getValidTokens(userId);
    
    return NextResponse.json({
      success: true,
      isConnected: !!tokens,
      hasValidTokens: !!tokens,
    });

  } catch (error) {
    console.error('Twitter auth status check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check Twitter authentication status',
        code: 'AUTH_STATUS_ERROR',
      },
      { status: 500 }
    );
  }
} 