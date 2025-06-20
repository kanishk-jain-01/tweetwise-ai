'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { Calendar, CheckCircle, Clock, Loader2, Send, Twitter, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TwitterOperationLoadingProps {
  type: 'connecting' | 'posting' | 'scheduling' | 'disconnecting' | 'refreshing';
  message?: string;
  progress?: number; // 0-100 for progress bar
  showCancel?: boolean;
  onCancel?: () => void;
  className?: string;
}

export const TwitterOperationLoading = ({
  type,
  message,
  progress,
  showCancel = false,
  onCancel,
  className = '',
}: TwitterOperationLoadingProps) => {
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getLoadingConfig = () => {
    switch (type) {
      case 'connecting':
        return {
          icon: <Twitter className="w-6 h-6 text-blue-500" />,
          title: 'Connecting to Twitter',
          defaultMessage: 'Redirecting to Twitter for authentication',
          color: 'blue',
          badge: (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Connecting
            </Badge>
          ),
        };
      case 'posting':
        return {
          icon: <Send className="w-6 h-6 text-green-500" />,
          title: 'Posting Tweet',
          defaultMessage: 'Publishing your tweet to Twitter',
          color: 'green',
          badge: (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Zap className="w-3 h-3 mr-1" />
              Posting
            </Badge>
          ),
        };
      case 'scheduling':
        return {
          icon: <Calendar className="w-6 h-6 text-blue-500" />,
          title: 'Scheduling Tweet',
          defaultMessage: 'Saving your scheduled tweet',
          color: 'blue',
          badge: (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Clock className="w-3 h-3 mr-1" />
              Scheduling
            </Badge>
          ),
        };
      case 'disconnecting':
        return {
          icon: <X className="w-6 h-6 text-red-500" />,
          title: 'Disconnecting',
          defaultMessage: 'Removing Twitter account connection',
          color: 'red',
          badge: (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Disconnecting
            </Badge>
          ),
        };
      case 'refreshing':
        return {
          icon: <CheckCircle className="w-6 h-6 text-gray-500" />,
          title: 'Refreshing Status',
          defaultMessage: 'Checking Twitter connection status',
          color: 'gray',
          badge: (
            <Badge variant="secondary">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Refreshing
            </Badge>
          ),
        };
      default:
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin text-gray-500" />,
          title: 'Loading',
          defaultMessage: 'Processing request',
          color: 'gray',
          badge: (
            <Badge variant="secondary">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Loading
            </Badge>
          ),
        };
    }
  };

  const config = getLoadingConfig();
  const displayMessage = message || config.defaultMessage;

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon with spinning animation */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              {config.icon}
            </div>
            {type !== 'refreshing' && (
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin opacity-30"></div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            {config.badge}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900">
            {config.title}
          </h3>

          {/* Message with animated dots */}
          <p className="text-sm text-gray-600">
            {displayMessage}{dots}
          </p>

          {/* Progress Bar */}
          {typeof progress === 'number' && (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300 ease-out',
                    config.color === 'blue' && 'bg-blue-500',
                    config.color === 'green' && 'bg-green-500',
                    config.color === 'red' && 'bg-red-500',
                    config.color === 'gray' && 'bg-gray-500'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {showCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="mt-2"
            >
              Cancel
            </Button>
          )}

          {/* Loading Tips */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg w-full">
            {type === 'connecting' && (
              <p>💡 You'll be redirected to Twitter to authorize TweetWiseAI. This window will automatically update once completed.</p>
            )}
            {type === 'posting' && (
              <p>⚡ Your tweet is being published to Twitter. This usually takes just a few seconds.</p>
            )}
            {type === 'scheduling' && (
              <p>📅 Your tweet is being saved and will be automatically posted at the scheduled time.</p>
            )}
            {type === 'disconnecting' && (
              <p>🔐 Removing your Twitter connection and cleaning up scheduled tweets.</p>
            )}
            {type === 'refreshing' && (
              <p>🔄 Verifying your Twitter connection status and updating user information.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Inline loading indicator for smaller spaces
interface InlineTwitterLoadingProps {
  type: 'posting' | 'scheduling' | 'connecting' | 'refreshing';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const InlineTwitterLoading = ({
  type,
  size = 'md',
  showText = true,
  className = '',
}: InlineTwitterLoadingProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getInlineConfig = () => {
    switch (type) {
      case 'posting':
        return { text: 'Posting...', icon: Send };
      case 'scheduling':
        return { text: 'Scheduling...', icon: Calendar };
      case 'connecting':
        return { text: 'Connecting...', icon: Twitter };
      case 'refreshing':
        return { text: 'Refreshing...', icon: Loader2 };
      default:
        return { text: 'Loading...', icon: Loader2 };
    }
  };

  const config = getInlineConfig();
  const IconComponent = config.icon;

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <IconComponent className={cn(sizeClasses[size], 'animate-spin text-muted-foreground')} />
      {showText && (
        <span className={cn(textSizeClasses[size], 'text-muted-foreground')}>
          {config.text}
        </span>
      )}
    </div>
  );
};

// Loading overlay for full-screen operations
interface TwitterLoadingOverlayProps {
  isVisible: boolean;
  type: 'connecting' | 'posting' | 'scheduling';
  message?: string;
  onCancel?: () => void;
}

export const TwitterLoadingOverlay = ({
  isVisible,
  type,
  message,
  onCancel,
}: TwitterLoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <TwitterOperationLoading
        type={type}
        message={message}
        showCancel={!!onCancel}
        onCancel={onCancel}
        className="max-w-sm"
      />
    </div>
  );
}; 