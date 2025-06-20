'use client';

import { AISuggestions } from '@/components/features/ai-suggestions/ai-suggestions';
import { TweetComposer } from '@/components/features/tweet-composer/tweet-composer';
import { TweetHistory } from '@/components/features/tweet-history/tweet-history';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { useAISuggestions } from '@/hooks/use-ai-suggestions';
import { useDebounce } from '@/hooks/use-debounce';
import { useTweetComposer } from '@/hooks/use-tweet-composer';
import { useEffect } from 'react';

export default function DashboardPage() {
  const composer = useTweetComposer();
  const suggestions = useAISuggestions();
  const debouncedContent = useDebounce(composer.content, 500);

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
              onAccept={suggestions.acceptSuggestion}
              onReject={suggestions.rejectSuggestion}
              onCritique={() => suggestions.requestCritique(composer.content)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
