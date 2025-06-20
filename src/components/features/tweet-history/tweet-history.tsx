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
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TweetHistoryProps {
  onSelectTweet: (tweet: Tweet) => void;
}

export const TweetHistory = ({ onSelectTweet }: TweetHistoryProps) => {
  const { tweets, isLoading, isRefreshing, refreshTweets } = useTweetHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'drafts' | 'completed'>('all');

  const filteredTweets = tweets.filter(tweet => {
    const matchesSearch = tweet.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'drafts' && tweet.status === 'draft') ||
      (filter === 'completed' && tweet.status === 'completed');
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

      toast.success(
        `${tweet.status === 'draft' ? 'Draft' : 'Tweet'} deleted successfully`
      );
      await refreshTweets(); // Refresh the list
    } catch (error) {
      console.error('Error deleting tweet:', error);
      toast.error('Failed to delete tweet');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const getStatusIcon = (status: string) => {
    return status === 'completed' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <Clock className="w-4 h-4 text-yellow-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'completed' ? (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 hover:bg-green-100"
      >
        Completed
      </Badge>
    ) : (
      <Badge variant="secondary">Draft</Badge>
    );
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
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
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
                            </div>
                          </div>

                          <p className="text-sm line-clamp-3 text-foreground">
                            {tweet.content}
                          </p>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{tweet.content.length}/280 chars</span>
                            <span>
                              {new Date(tweet.created_at).toLocaleDateString()}
                            </span>
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
