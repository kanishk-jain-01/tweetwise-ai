'use client';

import { AISuggestions } from '@/components/features/ai-suggestions/ai-suggestions';
import { TweetComposer } from '@/components/features/tweet-composer/tweet-composer';
import { TweetHistory } from '@/components/features/tweet-history/tweet-history';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Suggestion, useAISuggestions } from '@/hooks/use-ai-suggestions';
import { useDebounce } from '@/hooks/use-debounce';
import { useTweetComposer } from '@/hooks/use-tweet-composer';
import { useCallback, useEffect, useRef } from 'react';

export default function DashboardPage() {
  const composer = useTweetComposer();
  const suggestions = useAISuggestions();
  const debouncedContent = useDebounce(composer.content, 500);
  
  // Use ref to track current content to avoid stale closures
  const currentContentRef = useRef(composer.content);
  
  // Update ref whenever content changes
  useEffect(() => {
    currentContentRef.current = composer.content;
  }, [composer.content]);

  // Destructure the functions to ensure stable references for the useEffect dependency array
  const { fetchSpellingSuggestions, clearSuggestions } = suggestions;

  useEffect(() => {
    if (debouncedContent.trim()) {
      fetchSpellingSuggestions(debouncedContent);
    } else {
      clearSuggestions();
    }
    // Add the destructured functions to the dependency array
  }, [debouncedContent, fetchSpellingSuggestions, clearSuggestions]);

  // Text replacement function for applying suggestions
  const applyTextReplacement = useCallback((text: string, suggestion: Suggestion): string => {
    const { startIndex, original, suggestion: replacement } = suggestion;
    
    // Validate that the text at startIndex matches the original
    const actualText = text.substring(startIndex, startIndex + original.length);
    if (actualText !== original) {
      // Fallback: Search for the word in the text
      const wordIndex = text.indexOf(original);
      if (wordIndex !== -1) {
        // Use the found index instead
        const result = text.substring(0, wordIndex) + 
               replacement + 
               text.substring(wordIndex + original.length);
        
        return result;
      }
      
      // Word not found anywhere in text, return original
      return text;
    }
    
    // Apply the replacement (exact index match)
    const result = text.substring(0, startIndex) + 
           replacement + 
           text.substring(startIndex + original.length);
    
    return result;
  }, []);

  // Handle suggestion acceptance - use ref to get current content
  const handleAcceptSuggestion = useCallback((suggestion: Suggestion) => {
    // Get current content from ref to avoid stale closure
    const currentContent = currentContentRef.current;
    
    // Apply the text replacement using current content
    const newContent = applyTextReplacement(currentContent, suggestion);
    
    // Only proceed if the text actually changed
    if (newContent === currentContent) {
      // Text didn't change (likely due to mismatch), just remove the suggestion
      suggestions.rejectSuggestion(suggestion);
      return;
    }
    
    // Update content immediately
    composer.setContent(newContent);
    
    // Also update our ref immediately to ensure consistency
    currentContentRef.current = newContent;
    
    // Clear current suggestions 
    clearSuggestions();
    
    // Trigger immediate re-analysis on the new content
    if (newContent.trim()) {
      fetchSpellingSuggestions(newContent);
    }
  }, [applyTextReplacement, composer.setContent, clearSuggestions, fetchSpellingSuggestions, suggestions.rejectSuggestion]);

  // Handle suggestion rejection
  const handleRejectSuggestion = useCallback((suggestion: Suggestion) => {
    suggestions.rejectSuggestion(suggestion);
  }, [suggestions]);

  return (
    <div className="h-screen flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader />

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
    </div>
  );
}
