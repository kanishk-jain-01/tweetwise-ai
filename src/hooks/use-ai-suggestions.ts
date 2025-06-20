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

interface WritingCheckApiResponse {
  suggestions: Omit<Suggestion, 'id'>[];
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
  fetchWritingSuggestions: (text: string) => Promise<void>;
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

  const fetchWritingSuggestions = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSpellingSuggestions([]);
      setGrammarSuggestions([]);
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
      const response = await fetch('/api/ai/writing-check', {
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
          errorData.error || 'Failed to fetch writing suggestions'
        );
      }

      const data: WritingCheckApiResponse = await response.json();
      
      // Double-check abort status before updating state
      if (abortController.signal.aborted) {
        return;
      }

      // Add IDs and filter by type
      const suggestionsWithIds: Suggestion[] = data.suggestions.map(s => ({
        ...s,
        id: uuidv4(),
      }));

      // Filter into spelling and grammar arrays
      const spellingSuggestions = suggestionsWithIds.filter(s => s.type === 'spelling');
      const grammarSuggestions = suggestionsWithIds.filter(s => s.type === 'grammar');

      setSpellingSuggestions(spellingSuggestions);
      setGrammarSuggestions(grammarSuggestions);
    } catch (err) {
      // Ignore AbortError - it's expected when cancelling requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching writing suggestions:', err);
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
    if (!text.trim()) {
      setCritique(null);
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
      const response = await fetch('/api/ai/critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
        }),
        signal: abortController.signal,
      });

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to get critique'
        );
      }

      const data = await response.json();
      
      // Double-check abort status before updating state
      if (abortController.signal.aborted) {
        return;
      }

      setCritique(data.critique);
    } catch (err) {
      // Ignore AbortError - it's expected when cancelling requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error requesting critique:', err);
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
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
    fetchWritingSuggestions,
    rejectSuggestion,
    requestCritique,
    clearSuggestions,
  };
};
