'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTweetHistory } from '@/hooks/use-tweet-history';
import { Tweet } from '@/lib/database/schema';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Loader2,
    Search,
    Send
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
                            <span className="text-xs text-muted-foreground">
                              {formatDate(new Date(tweet.updated_at))}
                            </span>
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
