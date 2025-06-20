'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

// Twitter authentication state
export interface TwitterAuthState {
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  user: TwitterUser | null;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

// Twitter user information
export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  handle: string; // @username format
}

// Hook return type
export interface UseTwitterAuthReturn extends TwitterAuthState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// Custom hook for Twitter authentication
export const useTwitterAuth = (): UseTwitterAuthReturn => {
  const { data: session } = useSession();

  const [state, setState] = useState<TwitterAuthState>({
    isConnected: false,
    isLoading: true,
    isConnecting: false,
    isDisconnecting: false,
    user: null,
    error: null,
    connectionStatus: 'disconnected',
  });

  // Check Twitter connection status
  const checkConnectionStatus = useCallback(async () => {
    if (!session?.user?.id) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        connectionStatus: 'disconnected',
        user: null,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/twitter/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check Twitter connection status');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: data.isConnected,
        connectionStatus: data.isConnected ? 'connected' : 'disconnected',
        user: data.user
          ? {
              id: data.user.id,
              username: data.user.username,
              name: data.user.name,
              handle: `@${data.user.username}`,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error checking Twitter connection:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        connectionStatus: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check connection status',
        user: null,
      }));
    }
  }, [session?.user?.id]);

  // Connect to Twitter (initiate OAuth flow)
  const connect = useCallback(async () => {
    if (!session?.user?.id) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to connect Twitter',
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        error: null,
        connectionStatus: 'connecting',
      }));

      const response = await fetch('/api/twitter/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Twitter authentication');
      }

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Twitter OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authentication URL received');
      }
    } catch (error) {
      console.error('Error connecting to Twitter:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to Twitter',
      }));
    }
  }, [session?.user?.id]);

  // Disconnect from Twitter
  const disconnect = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isDisconnecting: true,
        error: null,
      }));

      const response = await fetch('/api/twitter/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Twitter account');
      }

      setState(prev => ({
        ...prev,
        isDisconnecting: false,
        isConnected: false,
        connectionStatus: 'disconnected',
        user: null,
      }));
    } catch (error) {
      console.error('Error disconnecting Twitter:', error);
      setState(prev => ({
        ...prev,
        isDisconnecting: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to disconnect Twitter account',
      }));
    }
  }, [session?.user?.id]);

  // Refresh connection status
  const refresh = useCallback(async () => {
    await checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check connection status on mount and when session changes
  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Handle OAuth callback completion (when user returns from Twitter)
  useEffect(() => {
    const handleOAuthCallback = () => {
      // Check if we're returning from OAuth (URL contains success or error params)
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('twitter_success');
      const error = urlParams.get('twitter_error');

      if (success === 'true') {
        // OAuth was successful, refresh status
        setTimeout(() => {
          checkConnectionStatus();
        }, 1000);

        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('twitter_success');
        window.history.replaceState({}, '', url.toString());
      } else if (error) {
        // OAuth failed
        setState(prev => ({
          ...prev,
          isConnecting: false,
          connectionStatus: 'error',
          error: decodeURIComponent(error),
        }));

        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('twitter_error');
        window.history.replaceState({}, '', url.toString());
      }
    };

    handleOAuthCallback();
  }, [checkConnectionStatus]);

  return {
    ...state,
    connect,
    disconnect,
    refresh,
    clearError,
  };
};

// Utility hook for checking if user needs Twitter connection
export const useTwitterConnectionRequired = () => {
  const { isConnected, isLoading } = useTwitterAuth();

  return {
    needsConnection: !isConnected && !isLoading,
    isCheckingConnection: isLoading,
  };
};

// Utility hook for Twitter user info
export const useTwitterUser = () => {
  const { user, isConnected, isLoading } = useTwitterAuth();

  return {
    twitterUser: user,
    hasTwitterUser: !!user && isConnected,
    isLoadingUser: isLoading,
  };
};
