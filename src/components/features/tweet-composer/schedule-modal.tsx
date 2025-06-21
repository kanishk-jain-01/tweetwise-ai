'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTwitterAuth } from '@/hooks/use-twitter-auth';
import { Calendar, Clock, Send, Twitter, Zap } from 'lucide-react';
import { useState } from 'react';
import { TwitterConnect } from './twitter-connect';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweetContent: string;
  characterCount: number;
  onScheduleTweet: (scheduledFor?: Date) => Promise<void>;
  isLoading?: boolean;
}

type PostingMode = 'immediate' | 'scheduled';

export const ScheduleModal = ({
  isOpen,
  onClose,
  tweetContent,
  characterCount,
  onScheduleTweet,
  isLoading = false,
}: ScheduleModalProps) => {
  const [postingMode, setPostingMode] = useState<PostingMode>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isConnected, user, isLoading: isTwitterLoading } = useTwitterAuth();

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPostingMode('immediate');
      setScheduledDate(undefined);
      setIsSubmitting(false);
      onClose();
    }
  };

  // Handle posting/scheduling
  const handleSubmit = async () => {
    if (!isConnected) return;

    setIsSubmitting(true);
    try {
      if (postingMode === 'immediate') {
        await onScheduleTweet();
      } else if (postingMode === 'scheduled' && scheduledDate) {
        await onScheduleTweet(scheduledDate);
      }
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to post/schedule tweet:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation
  const canSubmit = () => {
    if (!isConnected || isSubmitting || isLoading) return false;
    if (characterCount === 0 || characterCount > 280) return false;
    if (postingMode === 'scheduled' && !scheduledDate) return false;
    return true;
  };

  // Get minimum date (5 minutes from now)
  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now;
  };

  // Get maximum date (1 year from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Twitter className="w-5 h-5 mr-2 text-blue-500" />
            Post Tweet
          </DialogTitle>
          <DialogDescription>
            Choose when to post your tweet to Twitter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tweet Preview */}
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-sm whitespace-pre-wrap break-words">
                {tweetContent || 'Your tweet content will appear here...'}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Character count:</span>
              <Badge
                variant={
                  characterCount > 280
                    ? 'destructive'
                    : characterCount > 252
                      ? 'secondary'
                      : 'outline'
                }
              >
                {characterCount}/280
              </Badge>
            </div>
          </div>

          {/* Twitter Connection Status */}
          {!isConnected && !isTwitterLoading && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                Connect your Twitter account to post tweets.
              </p>
              <TwitterConnect compact />
            </div>
          )}

          {/* Connected User Info */}
          {isConnected && user && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Twitter className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  {user.name}
                </p>
                <p className="text-xs text-green-700">{user.handle}</p>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Connected
              </Badge>
            </div>
          )}

          {/* Posting Mode Selection */}
          {isConnected && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">When to post:</h4>

                {/* Immediate Option */}
                <div
                  className={`relative cursor-pointer rounded-lg border p-4 transition-colors ${
                    postingMode === 'immediate'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPostingMode('immediate')}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        postingMode === 'immediate'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {postingMode === 'immediate' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Post Now</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tweet will be posted immediately
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scheduled Option */}
                <div
                  className={`relative cursor-pointer rounded-lg border p-4 transition-colors ${
                    postingMode === 'scheduled'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPostingMode('scheduled')}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        postingMode === 'scheduled'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {postingMode === 'scheduled' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Schedule for Later</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose a specific date and time
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date/Time Picker for Scheduled Posts */}
              {postingMode === 'scheduled' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Select Date & Time</span>
                  </div>
                  <DateTimePicker
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    minDate={getMinDate()}
                    maxDate={getMaxDate()}
                    className="border-t pt-4"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {postingMode === 'immediate' ? 'Posting...' : 'Scheduling...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {postingMode === 'immediate' ? 'Post Now' : 'Schedule Tweet'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
