'use client';

import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Suggestion {
  id: string;
  type: 'spelling' | 'grammar';
  original: string;
  suggestion: string;
  startIndex: number;
  explanation?: string;
}

interface SpellCheckApiResponse {
  suggestions: Omit<Suggestion, 'id' | 'type'>[];
}

export interface Critique {
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
  fetchSpellingSuggestions: (text: string) => Promise<void>;
  acceptSuggestion: (suggestion: Suggestion) => void;
  rejectSuggestion: (suggestion: Suggestion) => void;
  requestCritique: (text: string) => Promise<void>;
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

  const fetchSpellingSuggestions = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSpellingSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/spell-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch spelling suggestions'
        );
      }

      const data: SpellCheckApiResponse = await response.json();
      const suggestionsWithIds: Suggestion[] = data.suggestions.map((s) => ({
        ...s,
        id: uuidv4(),
        type: 'spelling',
      }));
      setSpellingSuggestions(suggestionsWithIds);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching spelling suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptSuggestion = useCallback((suggestion: Suggestion) => {
    window.dispatchEvent(
      new CustomEvent('applySuggestion', {
        detail: { suggestion },
      })
    );

    setSpellingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    setGrammarSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, []);

  const rejectSuggestion = useCallback((suggestion: Suggestion) => {
    if (suggestion.type === 'spelling') {
      setSpellingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } else {
      setGrammarSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }
  }, []);

  const requestCritique = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
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
    fetchSpellingSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    requestCritique,
    clearSuggestions,
  };
};
