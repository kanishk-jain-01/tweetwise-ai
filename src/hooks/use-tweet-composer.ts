'use client';

import { Tweet } from '@/lib/database/schema';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type LoadedTweetType = 'draft' | 'scheduled' | 'sent' | 'completed' | null;

// Use the Tweet interface from schema for consistency
type LoadedTweetInfo = Tweet;

interface UseTweetComposerReturn {
  content: string;
  setContent: (content: string) => void;
  isLoading: boolean;
  clearContent: () => void;
  loadDraft: (tweet: LoadedTweetInfo) => void;
  autoSaveStatus: AutoSaveStatus;
  currentTweetId: string | null;
  loadedTweetType: LoadedTweetType;
  loadedTweetInfo: LoadedTweetInfo | null;
}

export const useTweetComposer = (
  debounceMs: number = 1500
): UseTweetComposerReturn => {
  const [content, setContent] = useState('');
  const [currentTweetId, setCurrentTweetId] = useState<string | null>(null);
  const [loadedTweetType, setLoadedTweetType] = useState<LoadedTweetType>(null);
  const [loadedTweetInfo, setLoadedTweetInfo] = useState<LoadedTweetInfo | null>(null);
  const [isLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const saveDraft = useCallback(
    async (draftContent: string) => {
      if (!draftContent.trim()) return;

      try {
        const body = {
          content: draftContent.trim(),
          status: 'draft',
          id: currentTweetId,
        };

        const response = await fetch('/api/tweets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // If we're trying to update a tweet that no longer exists
          if (response.status === 404 && currentTweetId) {
            console.warn(
              'Tweet not found - it may have been deleted. Resetting composer.'
            );
            setCurrentTweetId(null);
            setLoadedTweetType(null);
            setLoadedTweetInfo(null);
            setAutoSaveStatus('idle');
            // Try to save as a new tweet instead
            const newResponse = await fetch('/api/tweets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: draftContent.trim(),
                status: 'draft',
                id: null, // Force creation of new tweet
              }),
            });

            if (newResponse.ok) {
              const newResult = await newResponse.json();
              if (newResult.success && newResult.tweet && newResult.tweet.id) {
                const newTweet = newResult.tweet;
                setCurrentTweetId(newTweet.id);
                setLoadedTweetType('draft');
                setLoadedTweetInfo(newTweet);
                setAutoSaveStatus('saved');
                window.dispatchEvent(new CustomEvent('tweetSaved'));
                return;
              }
            }
          }

          throw new Error(errorData.error || 'Failed to save draft');
        }

        const result = await response.json();
        if (result.success && result.tweet && result.tweet.id) {
          if (!currentTweetId) {
            setCurrentTweetId(result.tweet.id);
            setLoadedTweetType('draft');
            setLoadedTweetInfo(result.tweet);
          } else if (loadedTweetInfo) {
            // Update existing loaded tweet info
            setLoadedTweetInfo({
              ...loadedTweetInfo,
              content: draftContent.trim(),
              updated_at: new Date()
            });
          }
          setAutoSaveStatus('saved');
          window.dispatchEvent(new CustomEvent('tweetSaved'));
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Error saving draft:', error);
        setAutoSaveStatus('error');

        // If we get an error and we have a currentTweetId, it might be because
        // the tweet was deleted. Reset the composer state.
        if (
          currentTweetId &&
          error instanceof Error &&
          error.message.includes('not found')
        ) {
          console.warn(
            'Resetting composer state due to save error - tweet may have been deleted'
          );
          setCurrentTweetId(null);
          setLoadedTweetType(null);
          setLoadedTweetInfo(null);
          setAutoSaveStatus('idle');
        }
      }
    },
    [currentTweetId, loadedTweetInfo]
  );

  useEffect(() => {
    if (!content) {
      setAutoSaveStatus('idle');
      return;
    }

    if (content.trim() === '') {
      setAutoSaveStatus('idle');
      return;
    }

    // Only auto-save for drafts, not for scheduled/sent tweets
    if (loadedTweetType && loadedTweetType !== 'draft') {
      return;
    }

    setAutoSaveStatus('saving');

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      saveDraft(content);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, debounceMs, saveDraft, loadedTweetType]);

  const clearContent = useCallback(() => {
    setContent('');
    setCurrentTweetId(null);
    setLoadedTweetType(null);
    setLoadedTweetInfo(null);
    setAutoSaveStatus('idle');
  }, []);

  const loadDraft = useCallback((tweet: LoadedTweetInfo) => {
    setContent(tweet.content);
    setCurrentTweetId(tweet.id);
    setLoadedTweetType(tweet.status);
    setLoadedTweetInfo(tweet);
    setAutoSaveStatus('saved');
  }, []);

  useEffect(() => {
    const handleLoadTweet = (event: CustomEvent) => {
      const { tweet } = event.detail;
      if (tweet && tweet.id && tweet.content) {
        loadDraft(tweet);
      }
    };

    // Listen for tweet deletion events
    const handleTweetDeleted = (event: CustomEvent) => {
      const { tweetId } = event.detail;
      // If the deleted tweet is the one we're currently editing, reset the composer
      if (currentTweetId === tweetId) {
        console.log('Currently loaded tweet was deleted, resetting composer');
        clearContent();
      }
    };

    window.addEventListener('loadTweet', handleLoadTweet as EventListener);
    window.addEventListener(
      'tweetDeleted',
      handleTweetDeleted as EventListener
    );

    return () => {
      window.removeEventListener('loadTweet', handleLoadTweet as EventListener);
      window.removeEventListener(
        'tweetDeleted',
        handleTweetDeleted as EventListener
      );
    };
  }, [loadDraft, clearContent, currentTweetId]);

  return {
    content,
    setContent,
    isLoading,
    clearContent,
    loadDraft,
    autoSaveStatus,
    currentTweetId,
    loadedTweetType,
    loadedTweetInfo,
  };
};
