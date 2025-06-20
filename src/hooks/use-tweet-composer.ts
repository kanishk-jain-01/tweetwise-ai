'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseTweetComposerReturn {
  content: string;
  setContent: (content: string) => void;
  isLoading: boolean;
  clearContent: () => void;
  loadDraft: (tweet: { id: string; content: string }) => void;
  autoSaveStatus: AutoSaveStatus;
  currentTweetId: string | null;
}

export const useTweetComposer = (
  debounceMs: number = 1500
): UseTweetComposerReturn => {
  const [content, setContent] = useState('');
  const [currentTweetId, setCurrentTweetId] = useState<string | null>(null);
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
            console.warn('Tweet not found - it may have been deleted. Resetting composer.');
            setCurrentTweetId(null);
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
                setCurrentTweetId(newResult.tweet.id);
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
        if (currentTweetId && error instanceof Error && error.message.includes('not found')) {
          console.warn('Resetting composer state due to save error - tweet may have been deleted');
          setCurrentTweetId(null);
          setAutoSaveStatus('idle');
        }
      }
    },
    [currentTweetId]
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
  }, [content, debounceMs, saveDraft]);

  const clearContent = useCallback(() => {
    setContent('');
    setCurrentTweetId(null);
    setAutoSaveStatus('idle');
  }, []);

  const loadDraft = useCallback((tweet: { id: string; content: string }) => {
    setContent(tweet.content);
    setCurrentTweetId(tweet.id);
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
    window.addEventListener('tweetDeleted', handleTweetDeleted as EventListener);

    return () => {
      window.removeEventListener('loadTweet', handleLoadTweet as EventListener);
      window.removeEventListener('tweetDeleted', handleTweetDeleted as EventListener);
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
  };
};
