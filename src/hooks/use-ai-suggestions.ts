'use client';

import { useCallback, useRef, useState } from 'react';
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
  
  // Add ref to track and cancel ongoing requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSpellingSuggestions = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSpellingSuggestions([]);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/spell-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: abortController.signal,
      });

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch spelling suggestions'
        );
      }

      const data: SpellCheckApiResponse = await response.json();
      
      // Double-check abort status before updating state
      if (abortController.signal.aborted) {
        return;
      }

      const suggestionsWithIds: Suggestion[] = data.suggestions.map(s => ({
        ...s,
        id: uuidv4(),
        type: 'spelling',
      }));
      setSpellingSuggestions(suggestionsWithIds);
    } catch (err) {
      // Ignore AbortError - it's expected when cancelling requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching spelling suggestions:', err);
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
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
    // Cancel any ongoing requests when clearing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setSpellingSuggestions([]);
    setGrammarSuggestions([]);
    setCritique(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    spellingSuggestions,
    grammarSuggestions,
    critique,
    isLoading,
    error,
    fetchSpellingSuggestions,
    rejectSuggestion,
    requestCritique,
    clearSuggestions,
  };
};
