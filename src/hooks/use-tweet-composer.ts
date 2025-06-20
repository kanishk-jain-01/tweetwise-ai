'use client';

import { useCallback, useRef, useState } from 'react';

interface UseTweetComposerReturn {
  content: string;
  setContent: (content: string) => void;
  isLoading: boolean;
  isSaving: boolean;
  saveDraft: () => Promise<void>;
  clearContent: () => void;
  lastSaved: Date | null;
  loadDraft: (content: string) => void;
}

export const useTweetComposer = (): UseTweetComposerReturn => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Use ref to track if we need to save (avoid saving empty content)
  const hasUnsavedChanges = useRef(false);

  const handleSetContent = useCallback((newContent: string) => {
    setContent(newContent);
    hasUnsavedChanges.current = true;
  }, []);

  const saveDraft = useCallback(async () => {
    if (!content.trim() || isSaving) return;

    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [content, isSaving]);

  const clearContent = useCallback(() => {
    setContent('');
    hasUnsavedChanges.current = false;
    setLastSaved(null);
  }, []);

  const loadDraft = useCallback((draftContent: string) => {
    setContent(draftContent);
    hasUnsavedChanges.current = false;
    setLastSaved(null); // Reset last saved when loading existing draft
  }, []);

  return {
    content,
    setContent: handleSetContent,
    isLoading,
    isSaving,
    saveDraft,
    clearContent,
    lastSaved,
    loadDraft,
  };
}; 