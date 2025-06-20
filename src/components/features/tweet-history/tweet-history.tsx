'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTweetHistory } from '@/hooks/use-tweet-history';
import { Tweet } from '@/lib/database/schema';
import { CheckCircle, Clock, FileText, MoreHorizontal, Search } from 'lucide-react';
import { useState } from 'react';

export const TweetHistory = () => {
  const { tweets, isLoading, searchTweets, loadTweet } = useTweetHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'drafts' | 'completed'>('all');

  const filteredTweets = tweets.filter(tweet => {
    const matchesSearch = tweet.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || tweet.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleTweetClick = (tweet: Tweet) => {
    loadTweet(tweet);
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
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Completed
      </Badge>
    ) : (
      <Badge variant="secondary">
        Draft
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tweets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
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
            ))
          ) : filteredTweets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No tweets match your search' : 'No tweets yet'}
              </p>
              <p className="text-xs mt-1">
                {searchQuery ? 'Try a different search term' : 'Start composing your first tweet!'}
              </p>
            </div>
          ) : (
            filteredTweets.map((tweet) => (
              <Card
                key={tweet.id}
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
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
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
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 