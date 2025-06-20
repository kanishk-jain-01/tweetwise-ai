'use client';

import { useCallback, useState } from 'react';

interface Suggestion {
  id: string;
  type: 'spelling' | 'grammar';
  original: string;
  replacement: string;
  explanation?: string;
  position?: { start: number; end: number };
}

interface Critique {
  engagementScore: number;
  clarity: number;
  tone: string;
  suggestions: string[];
}

interface UseAISuggestionsReturn {
  spellingSuggestions: Suggestion[];
  grammarSuggestions: Suggestion[];
  critique: Critique | null;
  isLoading: boolean;
  error: string | null;
  acceptSuggestion: (suggestion: Suggestion) => void;
  rejectSuggestion: (suggestion: Suggestion) => void;
  requestCritique: () => Promise<void>;
  clearSuggestions: () => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [spellingSuggestions, setSpellingSuggestions] = useState<Suggestion[]>(
    []
  );
  const [grammarSuggestions, setGrammarSuggestions] = useState<Suggestion[]>(
    []
  );
  const [critique, setCritique] = useState<Critique | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptSuggestion = useCallback((suggestion: Suggestion) => {
    // TODO: Apply the suggestion to the tweet content
    // console.log('Accepting suggestion:', suggestion);

    // Remove the suggestion from the list
    if (suggestion.type === 'spelling') {
      setSpellingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } else {
      setGrammarSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }

    // Dispatch event to notify tweet composer
    window.dispatchEvent(
      new CustomEvent('applySuggestion', {
        detail: { suggestion },
      })
    );
  }, []);

  const rejectSuggestion = useCallback((suggestion: Suggestion) => {
    // console.log('Rejecting suggestion:', suggestion);

    // Remove the suggestion from the list
    if (suggestion.type === 'spelling') {
      setSpellingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } else {
      setGrammarSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }
  }, []);

  const requestCritique = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/ai/critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Current tweet content', // This should come from tweet composer
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get critique');
      }

      const data = await response.json();
      setCritique(data.critique);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error requesting critique:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSpellingSuggestions([]);
    setGrammarSuggestions([]);
    setCritique(null);
    setError(null);
  }, []);



  return {
    spellingSuggestions,
    grammarSuggestions,
    critique,
    isLoading,
    error,
    acceptSuggestion,
    rejectSuggestion,
    requestCritique,
    clearSuggestions,
  };
};
