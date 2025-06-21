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

  // Handle tweet posting/scheduling
  const handleTweetPost = useCallback(async (scheduledFor?: Date) => {
    // TODO: Implement actual tweet posting logic
    console.log('Posting tweet:', {
      content: composer.content,
      scheduledFor,
    });
  }, [composer.content]);

  return (
    <div className="h-screen flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader
        onSelectTweet={composer.loadDraft}
        spellingSuggestions={suggestions.spellingSuggestions}
        grammarSuggestions={suggestions.grammarSuggestions}
        critique={suggestions.critique}
        isLoading={suggestions.isLoading}
        error={suggestions.error}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
        onCritique={() => suggestions.requestCritique(composer.content)}
      />

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tweet History */}
        <aside className="w-80 border-r bg-muted/50 flex-col hidden md:flex">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Tweet History & Drafts
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <TweetHistory onSelectTweet={composer.loadDraft} />
          </div>
        </aside>

        {/* Center Panel - Tweet Composer */}
        <main className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Compose Tweet
            </h2>
            <p className="text-xs text-muted-foreground mt-1 md:hidden">
              Use the buttons in the header to access History and AI suggestions
            </p>
          </div>
          <div className="flex-1 p-6">
            <TweetComposer
              content={composer.content}
              onContentChange={composer.setContent}
              autoSaveStatus={composer.autoSaveStatus}
              currentTweetId={composer.currentTweetId}
              onNewDraft={composer.clearContent}
              onScheduleTweet={handleScheduleTweet}
            />
          </div>
        </main>

        {/* Right Panel - AI Suggestions */}
        <aside className="w-80 border-l bg-muted/50 flex-col hidden lg:flex">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              AI Suggestions
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <AISuggestions
              spellingSuggestions={suggestions.spellingSuggestions}
              grammarSuggestions={suggestions.grammarSuggestions}
              critique={suggestions.critique}
              isLoading={suggestions.isLoading}
              error={suggestions.error}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
              onCritique={() => suggestions.requestCritique(composer.content)}
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
