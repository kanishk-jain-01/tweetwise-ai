'use client';

import { AISuggestions } from '@/components/features/ai-suggestions/ai-suggestions';
import { ScheduleModal } from '@/components/features/tweet-composer/schedule-modal';
import { TweetComposer } from '@/components/features/tweet-composer/tweet-composer';
import { TweetHistory } from '@/components/features/tweet-history/tweet-history';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Suggestion, useAISuggestions } from '@/hooks/use-ai-suggestions';
import { useDebounce } from '@/hooks/use-debounce';
import { useTweetComposer } from '@/hooks/use-tweet-composer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const composer = useTweetComposer();
  const suggestions = useAISuggestions();
  const debouncedContent = useDebounce(composer.content, 500);

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Use ref to track current content to avoid stale closures
  const currentContentRef = useRef(composer.content);

  // Track if we're in the middle of applying a suggestion to prevent re-analysis
  const isApplyingSuggestionRef = useRef(false);

  // Track the last loaded content to prevent AI calls on card clicks
  const lastLoadedContentRef = useRef<string>('');

  // Update ref whenever content changes
  useEffect(() => {
    currentContentRef.current = composer.content;
  }, [composer.content]);

  // Memoize the suggestion function to prevent unnecessary effect runs
  const fetchWritingSuggestions = useCallback(
    (text: string) => suggestions.fetchWritingSuggestions(text),
    [suggestions.fetchWritingSuggestions]
  );

  const clearSuggestions = useCallback(
    () => suggestions.clearSuggestions(),
    [suggestions.clearSuggestions]
  );

  // Debounced effect for AI checking - now with stable dependencies
  useEffect(() => {
    // Don't trigger AI checks if we're in the middle of applying a suggestion
    if (isApplyingSuggestionRef.current) {
      return;
    }

    // Don't trigger AI checks if content matches the last loaded content (prevents AI calls on card clicks)
    if (debouncedContent === lastLoadedContentRef.current) {
      return;
    }

    if (debouncedContent.trim()) {
      // Run comprehensive writing check (handles both spelling and grammar)
      fetchWritingSuggestions(debouncedContent);
    } else {
      clearSuggestions();
    }
  }, [debouncedContent, fetchWritingSuggestions, clearSuggestions]);

  // Text replacement function for applying suggestions
  const applyTextReplacement = useCallback(
    (text: string, suggestion: Suggestion): string => {
      const { startIndex, original, suggestion: replacement } = suggestion;

      // Validate that the text at startIndex matches the original
      const actualText = text.substring(
        startIndex,
        startIndex + original.length
      );
      if (actualText !== original) {
        // Fallback: Search for the first occurrence of the word in the text
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(
          `\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
        );
        const match = text.match(regex);
        if (match && match.index !== undefined) {
          // Use the found index instead
          const wordIndex = match.index;
          const result =
            text.substring(0, wordIndex) +
            replacement +
            text.substring(wordIndex + original.length);

          return result;
        }

        // If regex fails, try simple indexOf as last resort
        const wordIndex = text.indexOf(original);
        if (wordIndex !== -1) {
          const result =
            text.substring(0, wordIndex) +
            replacement +
            text.substring(wordIndex + original.length);

          return result;
        }

        // Word not found anywhere in text, return original
        return text;
      }

      // Apply the replacement (exact index match)
      const result =
        text.substring(0, startIndex) +
        replacement +
        text.substring(startIndex + original.length);

      return result;
    },
    []
  );

  // Handle suggestion acceptance - FIXED to prevent race conditions
  const handleAcceptSuggestion = useCallback(
    (suggestion: Suggestion) => {
      // Set flag to prevent debounced effect from triggering during suggestion application
      isApplyingSuggestionRef.current = true;

      // Get current content from ref to avoid stale closure
      const currentContent = currentContentRef.current;

      // Apply the text replacement using current content
      const newContent = applyTextReplacement(currentContent, suggestion);

      // Only proceed if the text actually changed
      if (newContent === currentContent) {
        // Text didn't change (likely due to mismatch), just remove the suggestion
        suggestions.rejectSuggestion(suggestion);
        isApplyingSuggestionRef.current = false;
        return;
      }

      // Update content immediately
      composer.setContent(newContent);

      // Also update our ref immediately to ensure consistency
      currentContentRef.current = newContent;

      // Remove the accepted suggestion from the list immediately
      suggestions.rejectSuggestion(suggestion);

      // Clear the flag after a short delay to allow content to settle
      // This prevents the debounced effect from immediately re-analyzing
      setTimeout(() => {
        isApplyingSuggestionRef.current = false;
      }, 100);

      // Note: We removed the immediate re-analysis call here to prevent race conditions
      // The debounced effect will handle re-analysis after the timeout
    },
    [applyTextReplacement, composer.setContent, suggestions.rejectSuggestion]
  );

  // Handle suggestion rejection
  const handleRejectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      suggestions.rejectSuggestion(suggestion);
    },
    [suggestions.rejectSuggestion]
  );

  // Handle opening the schedule modal
  const handleScheduleTweet = useCallback(() => {
    setIsScheduleModalOpen(true);
  }, []);

  // Listen for openScheduleModal events from tweet history
  useEffect(() => {
    const handleOpenScheduleModal = () => {
      setIsScheduleModalOpen(true);
    };

    window.addEventListener('openScheduleModal', handleOpenScheduleModal);

    return () => {
      window.removeEventListener('openScheduleModal', handleOpenScheduleModal);
    };
  }, []);

  // Listen for content loading events to prevent AI triggers
  useEffect(() => {
    const handleContentLoading = (event: CustomEvent) => {
      // Track the loaded content to prevent AI calls
      lastLoadedContentRef.current = event.detail.content;

      // Clear suggestions when loading a tweet
      clearSuggestions();
    };

    window.addEventListener(
      'contentLoading',
      handleContentLoading as EventListener
    );

    return () => {
      window.removeEventListener(
        'contentLoading',
        handleContentLoading as EventListener
      );
    };
  }, [clearSuggestions]);

  // Handle tweet posting/scheduling
  const handleTweetPost = useCallback(
    async (scheduledFor?: Date) => {
      if (!composer.content.trim()) {
        toast.error('Tweet content cannot be empty');
        return;
      }

      if (composer.content.length > 280) {
        toast.error('Tweet content exceeds 280 characters');
        return;
      }

      try {
        if (scheduledFor) {
          // Schedule tweet for later
          const response = await fetch('/api/twitter/schedule', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: composer.content,
              scheduledFor: scheduledFor.toISOString(),
              tweetId: composer.currentTweetId,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to schedule tweet');
          }

          toast.success(`Tweet scheduled for ${scheduledFor.toLocaleString()}`);

          // Dispatch event for optimistic update
          window.dispatchEvent(
            new CustomEvent('tweetPosted', {
              detail: {
                tweetId: composer.currentTweetId,
                status: 'scheduled',
                tweetData: {
                  scheduledFor: scheduledFor.toISOString(),
                  ...data.data,
                },
              },
            })
          );

          // Clear the composer after successful scheduling
          composer.clearContent();
        } else {
          // Post tweet immediately
          const response = await fetch('/api/twitter/post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: composer.content,
              tweetId: composer.currentTweetId,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            // Handle specific error cases
            if (data.code === 'NOT_CONNECTED') {
              toast.error('Please connect your Twitter account first');
              return;
            }
            if (data.code === 'DUPLICATE_TWEET') {
              toast.error('This tweet appears to be a duplicate');
              return;
            }
            if (data.code === 'RATE_LIMITED') {
              toast.error(
                'Twitter rate limit exceeded. Please try again later.'
              );
              return;
            }
            throw new Error(data.error || 'Failed to post tweet');
          }

          toast.success('Tweet posted successfully!');

          // Dispatch event for optimistic update
          window.dispatchEvent(
            new CustomEvent('tweetPosted', {
              detail: {
                tweetId: composer.currentTweetId,
                status: 'sent',
                tweetData: data.data,
              },
            })
          );

          // Clear the composer after successful posting
          composer.clearContent();
        }
      } catch (error) {
        console.error('Error posting/scheduling tweet:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to post tweet'
        );
      }
    },
    [composer.content, composer.currentTweetId, composer.clearContent]
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
      {/* Dashboard Header */}
      <DashboardHeader
        onSelectTweet={composer.loadDraft}
        spellingSuggestions={suggestions.spellingSuggestions}
        grammarSuggestions={suggestions.grammarSuggestions}
        critique={suggestions.critique}
        isLoading={suggestions.isLoading}
        analysisLoading={suggestions.analysisLoading}
        error={suggestions.error}
        analysisMetadata={suggestions.analysisMetadata}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
        onCritique={forceRefresh =>
          suggestions.requestCritique(
            composer.content,
            composer.currentTweetId || undefined,
            forceRefresh
          )
        }
      />

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tweet History */}
        <aside className="w-80 border-r border-slate-200/50 bg-white/60 backdrop-blur-sm flex-col hidden md:flex">
          <div className="p-4 border-b border-slate-200/50">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tweet History & Drafts
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Access your saved drafts and tweet history
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <TweetHistory onSelectTweet={composer.loadDraft} />
          </div>
        </aside>

        {/* Center Panel - Tweet Composer */}
        <main className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm">
          <div className="px-4 pt-4 pb-2 border-b border-slate-200/50">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="font-bold text-base bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Compose Tweet
              </h2>
            </div>
            <p className="text-xs text-slate-600 md:hidden">
              Use the buttons in the header to access History and AI suggestions
            </p>
            <p className="text-xs text-slate-600 hidden md:block">
              Write your perfect tweet with AI-powered assistance
            </p>
          </div>
          <div className="flex-1 p-2">
            <TweetComposer
              content={composer.content}
              onContentChange={composer.setContent}
              autoSaveStatus={composer.autoSaveStatus}
              currentTweetId={composer.currentTweetId}
              loadedTweetType={composer.loadedTweetType}
              loadedTweetInfo={composer.loadedTweetInfo}
              onNewDraft={composer.clearContent}
              onScheduleTweet={handleScheduleTweet}
            />
          </div>
        </main>

        {/* Right Panel - AI Suggestions */}
        <aside className="w-80 border-l border-slate-200/50 bg-white/60 backdrop-blur-sm flex-col hidden lg:flex">
          <div className="p-4 border-b border-slate-200/50">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="font-bold text-base bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                AI Suggestions
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Real-time feedback and writing assistance
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <AISuggestions
              spellingSuggestions={suggestions.spellingSuggestions}
              grammarSuggestions={suggestions.grammarSuggestions}
              critique={suggestions.critique}
              isLoading={suggestions.isLoading}
              analysisLoading={suggestions.analysisLoading}
              error={suggestions.error}
              analysisMetadata={suggestions.analysisMetadata}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
              onCritique={forceRefresh =>
                suggestions.requestCritique(
                  composer.content,
                  composer.currentTweetId || undefined,
                  forceRefresh
                )
              }
            />
          </div>
        </aside>
      </div>

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        tweetContent={composer.content}
        characterCount={composer.content.length}
        onScheduleTweet={handleTweetPost}
      />
    </div>
  );
}
