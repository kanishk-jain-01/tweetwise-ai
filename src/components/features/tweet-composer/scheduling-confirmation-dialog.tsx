'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, CheckCircle, Clock, ExternalLink, Twitter, Zap } from 'lucide-react';

interface SchedulingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  type: 'posted' | 'scheduled';
  tweetContent: string;
  scheduledFor?: Date;
  tweetUrl?: string;
  twitterUser?: {
    name: string;
    handle: string;
  };
}

export const SchedulingConfirmationDialog = ({
  isOpen,
  onClose,
  onCreateNew,
  type,
  tweetContent,
  scheduledFor,
  tweetUrl,
  twitterUser,
}: SchedulingConfirmationDialogProps) => {
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  const handleViewTweet = () => {
    if (tweetUrl) {
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getConfirmationContent = () => {
    if (type === 'posted') {
      return {
        title: 'Tweet Posted Successfully!',
        description: 'Your tweet has been posted to Twitter.',
        icon: <Zap className="w-6 h-6 text-green-500" />,
        statusBadge: (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Posted
          </Badge>
        ),
        actionText: 'View on Twitter',
      };
    } else {
      return {
        title: 'Tweet Scheduled Successfully!',
        description: 'Your tweet has been scheduled and will be posted automatically.',
        icon: <Calendar className="w-6 h-6 text-blue-500" />,
        statusBadge: (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        ),
        actionText: 'View Schedule',
      };
    }
  };

  const formatScheduledTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const content = getConfirmationContent();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
            {content.icon}
          </div>
          <DialogTitle className="text-center">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            {content.statusBadge}
          </div>

          {/* Twitter User Info */}
          {twitterUser && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Twitter className="w-4 h-4 text-blue-500" />
              <span>Posted to {twitterUser.handle}</span>
            </div>
          )}

          {/* Tweet Content Preview */}
          <div className="p-4 bg-muted rounded-lg border">
            <p className="text-sm whitespace-pre-wrap break-words">
              {tweetContent}
            </p>
          </div>

          {/* Scheduled Time Display */}
          {type === 'scheduled' && scheduledFor && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Scheduled for:</span>
              </div>
              <div className="text-sm text-blue-800">
                <div className="font-medium">
                  {formatScheduledTime(scheduledFor).date}
                </div>
                <div>
                  at {formatScheduledTime(scheduledFor).time}
                </div>
              </div>
            </div>
          )}

          {/* Posted Time Display */}
          {type === 'posted' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Posted at:</span>
              </div>
              <div className="text-sm text-green-800">
                {new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            </div>
          )}

          {/* Success Tips */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              {type === 'posted' 
                ? '✨ Your tweet is now live! It may take a few moments to appear in your Twitter feed.'
                : '⏰ Your scheduled tweet will be posted automatically. You can manage your scheduled tweets in the History panel.'
              }
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* View Tweet/Schedule Button */}
          {type === 'posted' && tweetUrl ? (
            <Button
              variant="outline"
              onClick={handleViewTweet}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {content.actionText}
            </Button>
          ) : type === 'scheduled' ? (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View History
            </Button>
          ) : null}

          {/* Create New Tweet Button */}
          <Button
            onClick={handleCreateNew}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
          >
            <Twitter className="w-4 h-4 mr-2" />
            Create New Tweet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 