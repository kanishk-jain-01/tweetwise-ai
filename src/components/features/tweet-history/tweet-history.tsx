'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTweetHistory } from '@/hooks/use-tweet-history';
import { Tweet } from '@/lib/database/schema';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    ExternalLink,
    FileText,
    Loader2,
    MoreHorizontal,
    Search,
    Send,
    Trash2,
    X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TweetHistoryProps {
  onSelectTweet: (tweet: Tweet) => void;
}

export const TweetHistory = ({ onSelectTweet }: TweetHistoryProps) => {
  const { tweets, isLoading, isRefreshing, refreshTweets } = useTweetHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'drafts' | 'scheduled-sent'>('all');

  const filteredTweets = tweets.filter(tweet => {
    const matchesSearch = tweet.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'drafts' && tweet.status === 'draft') ||
      (filter === 'scheduled-sent' && (tweet.status === 'scheduled' || tweet.status === 'sent' || tweet.status === 'completed'));
    return matchesSearch && matchesFilter;
  });

  const handleTweetClick = (tweet: Tweet) => {
    onSelectTweet(tweet);
    toast.success(
      `Loaded ${tweet.status === 'draft' ? 'draft' : 'tweet'} into composer`
    );
  };

  const handleDeleteTweet = async (tweet: Tweet, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    if (!confirm(`Are you sure you want to delete this ${tweet.status}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tweets?id=${tweet.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tweet');
      }

      // Dispatch custom event to notify other components about the deletion
      window.dispatchEvent(
        new CustomEvent('tweetDeleted', {
          detail: { tweetId: tweet.id },
        })
      );

      toast.success(
        `${tweet.status === 'draft' ? 'Draft' : 'Tweet'} deleted successfully`
      );
      await refreshTweets(); // Refresh the list
    } catch (error) {
      console.error('Error deleting tweet:', error);
      toast.error('Failed to delete tweet');
    }
  };

  const handleViewOnTwitter = async (tweet: Tweet, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    if (!tweet.tweet_id) {
      toast.error('Twitter link not available for this tweet');
      return;
    }

    try {
      // Get user's Twitter username from the API
      const response = await fetch('/api/twitter/status');
      const data = await response.json();
      
      if (!response.ok || !data.connected || !data.user?.username) {
        toast.error('Unable to get Twitter username');
        return;
      }

      const twitterUrl = `https://twitter.com/${data.user.username}/status/${tweet.tweet_id}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening Twitter link:', error);
      toast.error('Failed to open Twitter link');
    }
  };

  const handleCancelScheduledTweet = async (tweet: Tweet, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

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
          tweetId: tweet.id,
          action: 'cancel',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel scheduled tweet');
      }

      toast.success('Scheduled tweet cancelled and converted to draft');
      await refreshTweets(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling scheduled tweet:', error);
      toast.error('Failed to cancel scheduled tweet');
    }
  };

  const handleRescheduleScheduledTweet = (tweet: Tweet, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    // Load the tweet content into the composer
    onSelectTweet(tweet);
    
    // Dispatch custom event to open the scheduling modal
    window.dispatchEvent(
      new CustomEvent('openScheduleModal', {
        detail: { tweet },
      })
    );

    toast.success('Tweet loaded into composer - update the schedule time');
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getDisplayTime = (tweet: Tweet) => {
    switch (tweet.status) {
      case 'scheduled':
        return tweet.scheduled_for ? new Date(tweet.scheduled_for) : new Date(tweet.created_at);
      case 'sent':
        return tweet.sent_at ? new Date(tweet.sent_at) : new Date(tweet.updated_at);
      case 'completed':
      case 'draft':
      default:
        return new Date(tweet.updated_at);
    }
  };

  const getTimeLabel = (tweet: Tweet) => {
    switch (tweet.status) {
      case 'scheduled':
        return 'Scheduled for';
      case 'sent':
        return 'Sent';
      case 'completed':
        return 'Completed';
      case 'draft':
      default:
        return 'Updated';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'draft':
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Sent
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Completed
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
          >
            Scheduled
          </Badge>
        );
      case 'draft':
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter */}
      <div className="flex-shrink-0 p-4 space-y-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          {isRefreshing && <Loader2 className="w-5 h-5 animate-spin" />}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tweets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'drafts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('drafts')}
          >
            Drafts
          </Button>
          <Button
            variant={filter === 'scheduled-sent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('scheduled-sent')}
          >
            Scheduled/Sent
          </Button>
        </div>
      </div>

      {/* Tweet List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-muted rounded w-20"></div>
                          <div className="h-4 bg-muted rounded w-16"></div>
                        </div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : filteredTweets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {searchQuery
                    ? 'No tweets match your search'
                    : 'No tweets yet'}
                </p>
                <p className="text-xs mt-1">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Start composing your first tweet!'}
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {filteredTweets.map(tweet => (
                  <motion.div
                    key={tweet.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                  >
                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleTweetClick(tweet)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(tweet.status)}
                              {getStatusBadge(tweet.status)}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(new Date(tweet.updated_at))}
                              </span>
                              {tweet.status === 'sent' && tweet.tweet_id ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={e => handleViewOnTwitter(tweet, e)}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View on Twitter
                                </Button>
                              ) : tweet.status === 'scheduled' ? (
                                <div className="flex space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={e => handleRescheduleScheduledTweet(tweet, e)}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Reschedule
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={e => handleCancelScheduledTweet(tweet, e)}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={e => handleDeleteTweet(tweet, e)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete{' '}
                                      {tweet.status === 'draft'
                                        ? 'Draft'
                                        : 'Tweet'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>

                          <p className="text-sm line-clamp-3 text-foreground">
                            {tweet.content}
                          </p>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{tweet.content.length}/280 chars</span>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {getTimeLabel(tweet)}: {formatDateTime(getDisplayTime(tweet))}
                              </span>
                              <span>
                                Created {new Date(tweet.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
