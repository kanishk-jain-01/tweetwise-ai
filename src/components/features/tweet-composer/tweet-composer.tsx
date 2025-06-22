'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AutoSaveStatus, LoadedTweetType } from '@/hooks/use-tweet-composer';
import { Tweet } from '@/lib/database/schema';
import { cn } from '@/lib/utils/cn';
import { AlertCircle, Calendar, Check, CheckCircle, CircleDashed, Clock, Edit, ExternalLink, FilePlus, Send, Trash2, X } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface TweetComposerProps {
  content: string;
  onContentChange: (content: string) => void;
  autoSaveStatus: AutoSaveStatus;
  currentTweetId: string | null;
  loadedTweetType: LoadedTweetType;
  loadedTweetInfo: Tweet | null;
  onNewDraft: () => void;
  onScheduleTweet?: () => void;
}

export const TweetComposer = ({
  content,
  onContentChange,
  autoSaveStatus,
  loadedTweetType,
  loadedTweetInfo,
  onNewDraft,
  onScheduleTweet,
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

  const getLoadedTweetIndicator = () => {
    if (!loadedTweetType) {
      return null;
    }

    const indicators = {
      draft: {
        icon: <Clock className="w-4 h-4 text-yellow-500" />,
        badge: <Badge variant="secondary">Draft</Badge>,
        label: 'Editing Draft'
      },
      scheduled: {
        icon: <Calendar className="w-4 h-4 text-blue-500" />,
        badge: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>,
        label: 'Viewing Scheduled Tweet'
      },
      sent: {
        icon: <Send className="w-4 h-4 text-green-500" />,
        badge: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sent</Badge>,
        label: 'Viewing Sent Tweet'
      },
      completed: {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        badge: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>,
        label: 'Viewing Completed Tweet'
      }
    };

    const indicator = indicators[loadedTweetType];
    
    return (
      <div className="flex items-center space-x-2">
        {indicator.icon}
        {indicator.badge}
        <span className="text-sm text-muted-foreground">{indicator.label}</span>
      </div>
    );
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

  const handleDeleteTweet = useCallback(async () => {
    if (!loadedTweetInfo) return;

    if (!confirm(`Are you sure you want to delete this ${loadedTweetType}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tweets?id=${loadedTweetInfo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tweet');
      }

      // Dispatch custom event to notify other components about the deletion
      window.dispatchEvent(
        new CustomEvent('tweetDeleted', {
          detail: { tweetId: loadedTweetInfo.id },
        })
      );

      toast.success(`${loadedTweetType === 'draft' ? 'Draft' : 'Tweet'} deleted successfully`);
      
      // Clear the composer after deletion
      onNewDraft();
    } catch (error) {
      console.error('Error deleting tweet:', error);
      toast.error('Failed to delete tweet');
    }
  }, [loadedTweetInfo, loadedTweetType, onNewDraft]);

  const handleCancelScheduledTweet = useCallback(async () => {
    if (!loadedTweetInfo) return;

    if (!confirm('Cancel this scheduled tweet and convert it back to a draft?')) {
      return;
    }

    try {
      const response = await fetch('/api/twitter/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetId: loadedTweetInfo.id,
          action: 'cancel',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel scheduled tweet');
      }

      toast.success('Tweet cancelled and converted to draft');
      
      // Dispatch custom event to refresh tweet history
      window.dispatchEvent(new CustomEvent('tweetSaved'));
      
      // Update the local state to reflect the change
      if (loadedTweetInfo) {
        const updatedTweet = {
          ...loadedTweetInfo,
          status: 'draft' as const,
          scheduled_for: null
        };
        // Reload the tweet as a draft
        window.dispatchEvent(
          new CustomEvent('loadTweet', {
            detail: { tweet: updatedTweet },
          })
        );
      }
    } catch (error) {
      console.error('Error cancelling scheduled tweet:', error);
      toast.error('Failed to cancel scheduled tweet');
    }
  }, [loadedTweetInfo]);

  const handleRescheduleScheduledTweet = useCallback(() => {
    if (!loadedTweetInfo) return;

    // Dispatch custom event to open the scheduling modal
    window.dispatchEvent(
      new CustomEvent('openScheduleModal', {
        detail: { tweet: loadedTweetInfo },
      })
    );

    toast.success('Update the schedule time in the modal');
  }, [loadedTweetInfo]);

  const handleViewOnTwitter = useCallback(async () => {
    if (!loadedTweetInfo?.tweet_id) {
      toast.error('Twitter link not available for this tweet');
      return;
    }

    try {
      // Get user's Twitter username from the API
      const response = await fetch('/api/twitter/status');
      const data = await response.json();
      
      if (!response.ok || !data.isConnected || !data.user?.username) {
        toast.error('Unable to get Twitter username');
        return;
      }

      const twitterUrl = `https://twitter.com/${data.user.username}/status/${loadedTweetInfo.tweet_id}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening Twitter link:', error);
      toast.error('Failed to open Twitter link');
    }
  }, [loadedTweetInfo]);

  const isReadOnly = loadedTweetType === 'sent' || loadedTweetType === 'completed';

  const renderActionButtons = () => {
    switch (loadedTweetType) {
      case 'draft':
        return (
          <>
            <div className="flex items-center space-x-2">
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
                variant="outline"
                size="sm"
                onClick={handleDeleteTweet}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
            <Button
              size="sm"
              disabled={characterCount === 0 || characterCount > maxChars}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={onScheduleTweet}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule/Send Tweet
            </Button>
          </>
        );

      case 'scheduled':
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewDraft}
            >
              <FilePlus className="w-4 h-4 mr-2" />
              New Draft
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRescheduleScheduledTweet}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelScheduledTweet}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </>
        );

      case 'sent':
      case 'completed':
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewDraft}
            >
              <FilePlus className="w-4 h-4 mr-2" />
              New Draft
            </Button>
            <Button
              size="sm"
              onClick={handleViewOnTwitter}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!loadedTweetInfo?.tweet_id}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Twitter
            </Button>
          </>
        );

      default:
        // No tweet loaded - show default buttons
        return (
          <>
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
              onClick={onScheduleTweet}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule/Send Tweet
            </Button>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Loaded Tweet Indicator */}
      {loadedTweetType && (
        <div className="px-4 py-2 border-b bg-muted/30">
          {getLoadedTweetIndicator()}
        </div>
      )}

      <div className="relative flex-1">
        <Textarea
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder={isReadOnly ? "This tweet has already been posted and cannot be edited." : "What's happening?"}
          className="w-full h-full text-lg resize-none border-none focus-visible:ring-0 p-4"
          aria-label="Tweet composer"
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
        {isReadOnly && (
          <div className="absolute inset-0 bg-muted/20 pointer-events-none" />
        )}
      </div>
      
      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {!isReadOnly && getAutoSaveIndicator()}
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
                stroke={getCharacterCountColor(characterCount).replace(
                  'text-',
                  ''
                )}
                strokeWidth="2"
                strokeDasharray={`${charPercentage}, 100`}
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t bg-background">
        {renderActionButtons()}
      </div>
    </div>
  );
};
