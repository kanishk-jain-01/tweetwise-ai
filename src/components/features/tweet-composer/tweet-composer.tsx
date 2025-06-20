'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AutoSaveStatus, useTweetComposer } from '@/hooks/use-tweet-composer';
import { FilePlus, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const TWITTER_CHAR_LIMIT = 280;
const DEBOUNCE_DELAY = 500; // 500ms for AI triggers

const AutoSaveStatusIndicator = ({
  status,
}: {
  status: AutoSaveStatus;
}) => {
  switch (status) {
    case 'saving':
      return (
        <span className="text-xs text-muted-foreground animate-pulse">
          Saving...
        </span>
      );
    case 'saved':
      return <span className="text-xs text-green-600">Saved</span>;
    case 'error':
      return <span className="text-xs text-destructive">Error saving</span>;
    default:
      return <div className="h-[18px]" />; // Placeholder to prevent layout shift
  }
};

export const TweetComposer = () => {
  const {
    content,
    setContent,
    isLoading,
    clearContent,
    autoSaveStatus,
    currentTweetId,
  } = useTweetComposer();

  const [charCount, setCharCount] = useState(0);
  const [charStatus, setCharStatus] = useState<'normal' | 'warning' | 'over'>(
    'normal',
  );

  // Update character count and status
  useEffect(() => {
    const count = content.length;
    setCharCount(count);

    if (count > TWITTER_CHAR_LIMIT) {
      setCharStatus('over');
    } else if (count > TWITTER_CHAR_LIMIT * 0.9) {
      // Warning at 90%
      setCharStatus('warning');
    } else {
      setCharStatus('normal');
    }
  }, [content]);

  // Debounced AI trigger (placeholder for now)
  useEffect(() => {
    if (!content.trim()) return;

    const debounceTimer = setTimeout(() => {
      // TODO: Trigger AI spell/grammar check
      // console.log('AI check triggered for:', content.slice(0, 50) + '...');
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(debounceTimer);
  }, [content]);

  const handleNewDraft = useCallback(() => {
    if (
      content.trim() &&
      !confirm('You have unsaved changes. Start a new draft anyway?')
    ) {
      return;
    }
    clearContent();
    toast.success('New draft started');
  }, [content, clearContent]);

  const getCharCountColor = () => {
    switch (charStatus) {
      case 'over':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getCharCountBg = () => {
    switch (charStatus) {
      case 'over':
        return 'bg-destructive/10';
      case 'warning':
        return 'bg-yellow-100';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Main Composition Area */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's happening?"
            className="flex-1 resize-none border-none focus-visible:ring-0 text-lg leading-relaxed min-h-[200px]"
            disabled={isLoading}
          />

          {/* Character Counter & Save Status */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2 min-w-[80px]">
              <AutoSaveStatusIndicator status={autoSaveStatus} />
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`px-2 py-1 rounded-full text-sm font-medium ${getCharCountBg()} ${getCharCountColor()}`}
              >
                {charCount}/{TWITTER_CHAR_LIMIT}
              </div>

              {/* Progress Ring */}
              <div className="relative w-8 h-8">
                <svg
                  className="w-8 h-8 transform -rotate-90"
                  viewBox="0 0 32 32"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 14}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      14 *
                      (1 - Math.min(charCount / TWITTER_CHAR_LIMIT, 1))
                    }`}
                    className={
                      charStatus === 'over'
                        ? 'text-destructive'
                        : charStatus === 'warning'
                        ? 'text-yellow-600'
                          : 'text-primary'
                    }
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewDraft}
            disabled={isLoading || (!content.trim() && !currentTweetId)}
          >
            <FilePlus className="w-4 h-4 mr-2" />
            New Draft
          </Button>
        </div>

        <Button
          size="sm"
          disabled={isLoading || charStatus === 'over' || !content.trim()}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Send className="w-4 h-4 mr-2" />
          Complete Tweet
        </Button>
      </div>

      {/* Status Messages */}
      {charStatus === 'over' && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          Tweet is {charCount - TWITTER_CHAR_LIMIT} characters over the limit
        </div>
      )}
    </div>
  );
};
