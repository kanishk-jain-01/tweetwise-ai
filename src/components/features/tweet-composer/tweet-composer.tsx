'use client';

import { Textarea } from '@/components/ui/textarea';
import { AutoSaveStatus } from '@/hooks/use-tweet-composer';
import { cn } from '@/lib/utils/cn';
import { AlertCircle, Check, CircleDashed, FilePlus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface TweetComposerProps {
  content: string;
  onContentChange: (content: string) => void;
  autoSaveStatus: AutoSaveStatus;
  currentTweetId: string | null;
  onNewDraft: () => void;
}

export const TweetComposer = ({
  content,
  onContentChange,
  autoSaveStatus,
  onNewDraft,
}: TweetComposerProps) => {
  const characterCount = content.length;
  const maxChars = 280;
  const charPercentage = (characterCount / maxChars) * 100;

  const getCharacterCountColor = (count: number) => {
    if (count > maxChars) return 'text-red-500';
    if (count > maxChars * 0.9) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <>
            <CircleDashed className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span>Saved</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-500">Saving error</span>
          </>
        );
      default:
        return <span>Draft</span>;
    }
  };

  const handleNewDraft = useCallback(() => {
    if (
      content.trim() &&
      !confirm('You have unsaved changes. Start a new draft anyway?')
    ) {
      return;
    }
    onNewDraft();
    toast.success('New draft started');
  }, [content, onNewDraft]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1">
        <Textarea
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder="What's happening?"
          className="w-full h-full text-lg resize-none border-none focus-visible:ring-0 p-4"
          aria-label="Tweet composer"
        />
      </div>
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {getAutoSaveIndicator()}
        </div>
        <div className="flex items-center space-x-4">
          <div
            className={cn(
              'font-medium text-sm',
              getCharacterCountColor(characterCount)
            )}
          >
            {characterCount}/{maxChars}
          </div>
          <div className="relative w-8 h-8">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getCharacterCountColor(characterCount).replace('text-', '')}
                strokeWidth="2"
                strokeDasharray={`${charPercentage}, 100`}
              />
            </svg>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t bg-background">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewDraft}
          disabled={!content.trim() && autoSaveStatus === 'idle'}
        >
          <FilePlus className="w-4 h-4 mr-2" />
          New Draft
        </Button>
        <Button
          size="sm"
          disabled={characterCount === 0 || characterCount > maxChars}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          Complete Tweet
        </Button>
      </div>
    </div>
  );
};
