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
  optimisticallyUpdateTweet: (tweetId: string, updates: Partial<Tweet>) => void;
  optimisticallyAddTweet: (tweet: Tweet) => void;
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

  // Optimistically update a tweet in the local state
  const optimisticallyUpdateTweet = useCallback((tweetId: string, updates: Partial<Tweet>) => {
    setTweets(prevTweets => 
      prevTweets.map(tweet => 
        tweet.id === tweetId 
          ? { ...tweet, ...updates, updated_at: new Date() }
          : tweet
      )
    );
  }, []);

  // Optimistically add a new tweet to the local state
  const optimisticallyAddTweet = useCallback((tweet: Tweet) => {
    setTweets(prevTweets => [tweet, ...prevTweets]);
  }, []);

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

    const handleTweetPosted = (event: CustomEvent) => {
      const { tweetId, status, tweetData } = event.detail;
      
      if (tweetId) {
        // Update existing tweet
        optimisticallyUpdateTweet(tweetId, {
          status,
          ...(status === 'sent' && tweetData?.tweet_id && { 
            tweet_id: tweetData.tweet_id,
            sent_at: new Date()
          }),
          ...(status === 'scheduled' && tweetData?.scheduledFor && {
            scheduled_for: new Date(tweetData.scheduledFor)
          })
        });
      } else if (tweetData) {
        // Add new tweet
        optimisticallyAddTweet(tweetData);
      }

      // Still refresh in the background for data consistency
      setTimeout(() => refreshTweets(), 500);
    };

    const handleTweetDeleted = (event: CustomEvent) => {
      const { tweetId } = event.detail;
      setTweets(prevTweets => prevTweets.filter(tweet => tweet.id !== tweetId));
    };

    window.addEventListener('tweetSaved', handleTweetSaved);
    window.addEventListener('tweetPosted', handleTweetPosted as EventListener);
    window.addEventListener('tweetDeleted', handleTweetDeleted as EventListener);

    return () => {
      window.removeEventListener('tweetSaved', handleTweetSaved);
      window.removeEventListener('tweetPosted', handleTweetPosted as EventListener);
      window.removeEventListener('tweetDeleted', handleTweetDeleted as EventListener);
    };
  }, [refreshTweets, optimisticallyUpdateTweet, optimisticallyAddTweet]);

  return {
    tweets,
    isLoading,
    isRefreshing,
    error,
    searchTweets,
    loadTweet,
    refreshTweets,
    optimisticallyUpdateTweet,
    optimisticallyAddTweet,
  };
};
