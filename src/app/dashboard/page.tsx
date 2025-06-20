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
    
    console.log('🔧 applyTextReplacement called:', {
      textLength: text.length,
      startIndex,
      original,
      replacement,
      textAtIndex: text.substring(startIndex, startIndex + original.length),
      textPreview: text.substring(Math.max(0, startIndex - 10), startIndex + original.length + 10)
    });
    
    // Validate that the text at startIndex matches the original
    const actualText = text.substring(startIndex, startIndex + original.length);
    if (actualText !== original) {
      console.log('❌ Text mismatch at exact index, trying fallback search...');
      
      // Fallback: Search for the word in the text
      const wordIndex = text.indexOf(original);
      if (wordIndex !== -1) {
        console.log('✅ Found word at different index:', {
          originalIndex: startIndex,
          foundIndex: wordIndex,
          word: original
        });
        
        // Use the found index instead
        const result = text.substring(0, wordIndex) + 
               replacement + 
               text.substring(wordIndex + original.length);
               
        console.log('✅ Fallback replacement successful:', {
          originalLength: text.length,
          newLength: result.length,
          replaced: `"${original}" → "${replacement}"`,
          resultPreview: result.substring(Math.max(0, wordIndex - 10), wordIndex + replacement.length + 10)
        });
        
        return result;
      }
      
      console.log('❌ Word not found anywhere in text:', {
        expected: original,
        actual: actualText,
        startIndex,
        returning: 'original text unchanged'
      });
      return text;
    }
    
    // Apply the replacement (exact index match)
    const result = text.substring(0, startIndex) + 
           replacement + 
           text.substring(startIndex + original.length);
           
    console.log('✅ Text replacement successful (exact match):', {
      originalLength: text.length,
      newLength: result.length,
      replaced: `"${original}" → "${replacement}"`,
      resultPreview: result.substring(Math.max(0, startIndex - 10), startIndex + replacement.length + 10)
    });
    
    return result;
  }, []);

  // Handle suggestion acceptance - use ref to get current content
  const handleAcceptSuggestion = useCallback((suggestion: Suggestion) => {
    // Get current content from ref to avoid stale closure
    const currentContent = currentContentRef.current;
    
    console.log('🔧 Accepting suggestion:', {
      suggestionId: suggestion.id,
      original: suggestion.original,
      replacement: suggestion.suggestion,
      startIndex: suggestion.startIndex,
      currentContentLength: currentContent.length,
      currentContentPreview: currentContent.substring(0, 50) + '...',
      expectedTextAtIndex: currentContent.substring(suggestion.startIndex, suggestion.startIndex + suggestion.original.length)
    });
    
    // Apply the text replacement using current content
    const newContent = applyTextReplacement(currentContent, suggestion);
    
    console.log('📝 Text replacement result:', {
      changed: newContent !== currentContent,
      newContentLength: newContent.length,
      newContentPreview: newContent.substring(0, 50) + '...',
      actualChange: newContent !== currentContent ? `"${suggestion.original}" → "${suggestion.suggestion}"` : 'NO CHANGE'
    });
    
    // Only proceed if the text actually changed
    if (newContent === currentContent) {
      // Text didn't change (likely due to mismatch), just remove the suggestion
      console.log('⚠️ No text change detected, rejecting suggestion');
      suggestions.rejectSuggestion(suggestion);
      return;
    }
    
    console.log('🔄 About to update composer content...');
    console.log('📋 Before setContent - composer.content:', composer.content.substring(0, 50) + '...');
    
    // Update content immediately
    composer.setContent(newContent);
    
    // Also update our ref immediately to ensure consistency
    currentContentRef.current = newContent;
    
    // Add a small delay to check if the content was actually updated
    setTimeout(() => {
      console.log('📋 After setContent - composer.content:', composer.content.substring(0, 50) + '...');
      console.log('✅ Content update successful:', composer.content === newContent);
      console.log('📋 Ref content:', currentContentRef.current.substring(0, 50) + '...');
    }, 10);
    
    // Clear current suggestions 
    clearSuggestions();
    
    console.log('🔄 Triggering immediate re-analysis');
    
    // Trigger immediate re-analysis on the new content
    if (newContent.trim()) {
      fetchSpellingSuggestions(newContent);
    }
  }, [applyTextReplacement, composer.setContent, clearSuggestions, fetchSpellingSuggestions, suggestions.rejectSuggestion, composer.content]);

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
