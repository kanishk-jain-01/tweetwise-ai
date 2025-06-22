'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { AutoSaveStatus, LoadedTweetType } from '@/hooks/use-tweet-composer';
import { Tweet } from '@/lib/database/schema';
import { cn } from '@/lib/utils/cn';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  CircleDashed,
  Clock,
  Edit,
  ExternalLink,
  FilePlus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { ImagePanel } from './image-panel';

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
  currentTweetId,
  loadedTweetType,
  loadedTweetInfo,
  onNewDraft,
  onScheduleTweet,
}: TweetComposerProps) => {
  // Use the image generation hook
  const imageGeneration = useImageGeneration(currentTweetId);

  const characterCount = content.length;
  const maxChars = 280;
  const charPercentage = (characterCount / maxChars) * 100;

  // Load image when switching between tweets
  useEffect(() => {
    if (currentTweetId) {
      // Load image for all tweets (drafts, scheduled, sent, completed)
      // Images should be viewable even for read-only tweets
      imageGeneration.actions.loadImageForTweet(currentTweetId);
    } else {
      // Clear image state only when no tweet is loaded
      imageGeneration.actions.clearImageState();
    }
  }, [currentTweetId, loadedTweetType]); // Removed imageGeneration.actions from deps

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
        label: 'Editing Draft',
      },
      scheduled: {
        icon: <Calendar className="w-4 h-4 text-blue-500" />,
        badge: (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Scheduled
          </Badge>
        ),
        label: 'Viewing Scheduled Tweet',
      },
      sent: {
        icon: <Send className="w-4 h-4 text-green-500" />,
        badge: (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Sent
          </Badge>
        ),
        label: 'Viewing Sent Tweet',
      },
      completed: {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        badge: (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        ),
        label: 'Viewing Completed Tweet',
      },
    };

    const indicator = indicators[loadedTweetType];

    return (
      <div className="flex items-center space-x-2">
        {indicator.icon}
        {indicator.badge}
        <span className="text-sm text-muted-foreground">{indicator.label}</span>
        {imageGeneration.hasImage && (
          <Badge variant="outline" className="text-xs">
            📸 Image Attached
          </Badge>
        )}
      </div>
    );
  };

  const handleNewDraft = useCallback(() => {
    if (
      (content.trim() || imageGeneration.hasImage) &&
      !confirm('You have unsaved changes. Start a new draft anyway?')
    ) {
      return;
    }
    onNewDraft();
    imageGeneration.actions.clearImageState();
    toast.success('New draft started');
  }, [content, imageGeneration.hasImage, imageGeneration.actions, onNewDraft]);

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

      toast.success(
        `${loadedTweetType === 'draft' ? 'Draft' : 'Tweet'} deleted successfully`
      );

      // Clear the composer and image state after deletion
      imageGeneration.actions.clearImageState();
      onNewDraft();
    } catch (error) {
      console.error('Error deleting tweet:', error);
      toast.error('Failed to delete tweet');
    }
  }, [loadedTweetInfo, loadedTweetType, imageGeneration.actions, onNewDraft]);

  const handleCancelScheduledTweet = useCallback(async () => {
    if (!loadedTweetInfo) return;

    if (
      !confirm('Cancel this scheduled tweet and convert it back to a draft?')
    ) {
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
    } catch (error) {
      console.error('Error cancelling scheduled tweet:', error);
      toast.error('Failed to cancel scheduled tweet');
    }
  }, [loadedTweetInfo]);

  const handleRescheduleScheduledTweet = useCallback(() => {
    if (!loadedTweetInfo) return;

    // This would trigger the schedule modal
    onScheduleTweet?.();
  }, [loadedTweetInfo, onScheduleTweet]);

  const handleViewOnTwitter = useCallback(() => {
    if (!loadedTweetInfo?.tweet_id) {
      toast.error('No Twitter link available');
      return;
    }

    try {
      const twitterUrl = `https://twitter.com/i/web/status/${loadedTweetInfo.tweet_id}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening Twitter link:', error);
      toast.error('Failed to open Twitter link');
    }
  }, [loadedTweetInfo]);

  const isReadOnly =
    loadedTweetType === 'sent' || loadedTweetType === 'completed';

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
                disabled={
                  !content.trim() &&
                  !imageGeneration.hasImage &&
                  autoSaveStatus === 'idle'
                }
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
            <Button variant="outline" size="sm" onClick={handleNewDraft}>
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
            <Button variant="outline" size="sm" onClick={handleNewDraft}>
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
              disabled={
                !content.trim() &&
                !imageGeneration.hasImage &&
                autoSaveStatus === 'idle'
              }
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
      {/* Always-visible Status Bar - Fixed Height */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20 h-12 flex-shrink-0">
        <div className="flex items-center space-x-2">
          {loadedTweetType ? (
            getLoadedTweetIndicator()
          ) : (
            <div className="h-6 flex items-center">
              <span className="text-sm text-muted-foreground">New Tweet</span>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Dual Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 flex-1 min-h-0">
        {/* Left Panel - Text Composer with Fixed Heights */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Text Area with Fixed Height */}
          <div className="relative mb-3 h-80 flex-shrink-0">
            <Textarea
              value={content}
              onChange={e => onContentChange(e.target.value)}
              placeholder={
                isReadOnly
                  ? 'This tweet has already been posted and cannot be edited.'
                  : "What's happening?"
              }
              className="w-full h-full text-lg resize-none border-2 border-gray-200 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 p-4 transition-all duration-200"
              aria-label="Tweet composer"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            {isReadOnly && (
              <div className="absolute inset-0 bg-muted/20 pointer-events-none rounded-lg transition-opacity duration-200" />
            )}
          </div>

          {/* Fixed Height Character Count and Auto-save Status */}
          <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50 h-12 flex-shrink-0">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground min-w-0">
              {!isReadOnly ? (
                getAutoSaveIndicator()
              ) : (
                <div className="h-4 flex items-center">
                  <span>Read Only</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div
                className={cn(
                  'font-medium text-sm transition-colors duration-200',
                  getCharacterCountColor(characterCount)
                )}
              >
                {characterCount}/{maxChars}
              </div>
              <div className="relative w-6 h-6 flex-shrink-0">
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
                    stroke={
                      charPercentage > 100
                        ? '#ef4444'
                        : charPercentage > 90
                          ? '#eab308'
                          : '#22c55e'
                    }
                    strokeWidth="2"
                    strokeDasharray={`${Math.min(charPercentage, 100)}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Image Generation with Fixed Width */}
        <div className="lg:w-80 w-full flex flex-col min-h-0">
          <ImagePanel
            tweetContent={content}
            currentTweetId={currentTweetId}
            onImageGenerated={image => {
              // The hook handles this automatically, but we can add additional logic here if needed
              console.log('Image generated:', image.id);
            }}
            onImageRemoved={() => {
              // The hook handles this automatically, but we can add additional logic here if needed
              console.log('Image removed');
            }}
            currentImage={imageGeneration.state.currentImage}
            disabled={
              isReadOnly ||
              imageGeneration.state.isGenerating ||
              imageGeneration.state.isUploading
            }
            imageActions={imageGeneration.actions}
            imageState={imageGeneration.state}
          />
        </div>
      </div>

      {/* Fixed Height Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/20 h-20 flex-shrink-0">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground min-w-0 flex-1">
          {imageGeneration.hasImage && (
            <span className="flex items-center space-x-1 transition-opacity duration-200">
              <span>📸</span>
              <span className="truncate">
                Image attached (
                {imageGeneration.formatFileSize(
                  imageGeneration.imageMetadata?.fileSize || 0
                )}
                )
              </span>
            </span>
          )}
          {imageGeneration.state.error && (
            <span className="text-red-500 flex items-center space-x-1 transition-opacity duration-200">
              <span>⚠️</span>
              <span className="truncate">{imageGeneration.state.error}</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
};
