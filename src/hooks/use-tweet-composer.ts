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
  debounceMs: number = 1500,
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
          throw new Error('Failed to save draft');
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
      }
    },
    [currentTweetId],
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

  const loadDraft = useCallback(
    (tweet: { id: string; content: string }) => {
      setContent(tweet.content);
      setCurrentTweetId(tweet.id);
      setAutoSaveStatus('saved');
    },
    [],
  );

  useEffect(() => {
    const handleLoadTweet = (event: CustomEvent) => {
      const { tweet } = event.detail;
      if (tweet && tweet.id && tweet.content) {
        loadDraft(tweet);
      }
    };

    window.addEventListener('loadTweet', handleLoadTweet as EventListener);

    return () => {
      window.removeEventListener('loadTweet', handleLoadTweet as EventListener);
    };
  }, [loadDraft]);

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
