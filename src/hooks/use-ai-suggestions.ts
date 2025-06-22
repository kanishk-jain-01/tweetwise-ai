'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

export interface AnalysisMetadata {
  id?: string;
  created_at?: Date;
  isFromDatabase?: boolean;
}

interface UseAISuggestionsReturn {
  spellingSuggestions: Suggestion[];
  grammarSuggestions: Suggestion[];
  critique: Critique | null;
  isLoading: boolean;
  analysisLoading: boolean;
  error: string | null;
  analysisMetadata: AnalysisMetadata | null;
  fetchWritingSuggestions: (text: string) => Promise<void>;
  rejectSuggestion: (suggestion: Suggestion) => void;
  requestCritique: (
    text: string,
    tweetId?: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  loadExistingAnalysis: (tweetId: string) => Promise<void>;
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
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMetadata, setAnalysisMetadata] =
    useState<AnalysisMetadata | null>(null);

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
      const spellingSuggestions = suggestionsWithIds.filter(
        s => s.type === 'spelling'
      );
      const grammarSuggestions = suggestionsWithIds.filter(
        s => s.type === 'grammar'
      );

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

  const loadExistingAnalysis = useCallback(async (tweetId: string) => {
    if (!tweetId.trim()) {
      return;
    }

    setAnalysisLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ai/analysis/${tweetId}?type=critique`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // If 404, it just means no analysis exists yet - not an error
        if (response.status === 404) {
          setAnalysisMetadata(null);
          setCritique(null);
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load existing analysis');
      }

      const data = await response.json();

      if (data.success && data.data.analysis) {
        const analysis = data.data.analysis;
        const critiqueData = analysis.response_data as Critique;

        setCritique(critiqueData);
        setAnalysisMetadata({
          id: analysis.id,
          created_at: new Date(analysis.created_at),
          isFromDatabase: true,
        });
      } else {
        // No analysis found
        setAnalysisMetadata(null);
        setCritique(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load analysis';
      setError(errorMessage);
      console.error('Error loading existing analysis:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const requestCritique = useCallback(
    async (text: string, tweetId?: string, forceRefresh?: boolean) => {
      if (!text.trim()) {
        setCritique(null);
        setAnalysisMetadata(null);
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
        const requestBody: {
          content: string;
          tweetId?: string;
          forceRefresh?: boolean;
        } = {
          content: text,
        };

        // Include tweetId if provided for database storage
        // Handle null/undefined cases explicitly
        if (tweetId && tweetId.trim()) {
          requestBody.tweetId = tweetId;
        }

        // Include forceRefresh flag if provided
        if (forceRefresh) {
          requestBody.forceRefresh = forceRefresh;
        }

        const response = await fetch('/api/ai/critique', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get critique');
        }

        const data = await response.json();

        // Double-check abort status before updating state
        if (abortController.signal.aborted) {
          return;
        }

        setCritique(data.critique);

        // Update analysis metadata based on response and request context
        if (data.critique.id && data.critique.created_at) {
          // Analysis was stored/retrieved from database
          setAnalysisMetadata({
            id: data.critique.id,
            created_at: new Date(data.critique.created_at),
            isFromDatabase: !data.cached || data.source === 'database',
          });
        } else if (tweetId && tweetId.trim()) {
          // New analysis with valid tweetId - should be stored in database
          setAnalysisMetadata({
            isFromDatabase: true,
          });
        } else {
          // No tweetId or empty tweetId means temporary analysis (new unsaved tweet)
          setAnalysisMetadata({
            isFromDatabase: false,
          });
        }
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
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    // Cancel any ongoing requests when clearing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSpellingSuggestions([]);
    setGrammarSuggestions([]);
    setCritique(null);
    setAnalysisMetadata(null);
    setError(null);
    setIsLoading(false);
    setAnalysisLoading(false);
  }, []);

  // Event listener for content loading events to trigger analysis loading
  useEffect(() => {
    const handleContentLoading = (event: CustomEvent) => {
      const { tweetId } = event.detail;
      if (tweetId) {
        // Load existing analysis for the tweet
        loadExistingAnalysis(tweetId);
      } else {
        // Clear all analysis and suggestion states when starting a new tweet (no tweetId)
        clearSuggestions();
      }
    };

    // Add event listener
    window.addEventListener(
      'contentLoading',
      handleContentLoading as EventListener
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        'contentLoading',
        handleContentLoading as EventListener
      );
    };
  }, [loadExistingAnalysis]);

  return {
    spellingSuggestions,
    grammarSuggestions,
    critique,
    isLoading,
    analysisLoading,
    error,
    analysisMetadata,
    fetchWritingSuggestions,
    rejectSuggestion,
    requestCritique,
    loadExistingAnalysis,
    clearSuggestions,
  };
};
