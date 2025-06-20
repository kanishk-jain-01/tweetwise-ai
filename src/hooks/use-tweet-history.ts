'use client';

import { Tweet } from '@/lib/database/schema';
import { useCallback, useEffect, useState } from 'react';

interface UseTweetHistoryReturn {
  tweets: Tweet[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  searchTweets: (query: string) => void;
  loadTweet: (tweet: Tweet) => void;
  refreshTweets: () => Promise<void>;
}

export const useTweetHistory = (): UseTweetHistoryReturn => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTweets = useCallback(async (isRefresh: boolean = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/tweets');
      if (!response.ok) {
        throw new Error('Failed to fetch tweets');
      }

      const data = await response.json();
      setTweets(data.tweets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching tweets:', err);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  const searchTweets = useCallback((_query: string) => {
    // For now, filtering is handled in the component
    // In the future, this could make API calls for server-side search
    // console.log('Searching tweets for:', query);
  }, []);

  const loadTweet = useCallback((tweet: Tweet) => {
    // console.log('Loading tweet:', tweet.id, tweet.content);

    // Dispatch custom event to notify tweet composer
    window.dispatchEvent(
      new CustomEvent('loadTweet', {
        detail: { tweet },
      })
    );
  }, []);

  const refreshTweets = useCallback(async () => {
    await fetchTweets(true);
  }, [fetchTweets]);

  // Initial load
  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  // Listen for tweet saved events to refresh the list
  useEffect(() => {
    const handleTweetSaved = () => {
      // console.log('Tweet saved, refreshing history...');
      refreshTweets();
    };

    window.addEventListener('tweetSaved', handleTweetSaved);

    return () => {
      window.removeEventListener('tweetSaved', handleTweetSaved);
    };
  }, [refreshTweets]);

  return {
    tweets,
    isLoading,
    isRefreshing,
    error,
    searchTweets,
    loadTweet,
    refreshTweets,
  };
};
