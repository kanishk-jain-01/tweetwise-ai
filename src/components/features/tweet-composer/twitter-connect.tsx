'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTwitterAuth } from '@/hooks/use-twitter-auth';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Twitter,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useState } from 'react';

interface TwitterConnectProps {
  className?: string;
  showCard?: boolean;
  compact?: boolean;
}

export const TwitterConnect = ({
  className = '',
  showCard = true,
  compact = false,
}: TwitterConnectProps) => {
  const {
    isConnected,
    isLoading,
    isConnecting,
    isDisconnecting,
    user,
    error,
    connectionStatus,
    connect,
    disconnect,
    refresh,
    clearError,
  } = useTwitterAuth();

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleConnect = async () => {
    clearError();
    await connect();
  };

  const handleDisconnect = async () => {
    clearError();
    await disconnect();
    setShowDisconnectConfirm(false);
  };

  const handleRefresh = async () => {
    clearError();
    await refresh();
  };

  // Compact version for smaller spaces
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {isConnected && user ? (
          <>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected as {user.handle}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDisconnectConfirm(true)}
              disabled={isDisconnecting}
              className="h-6 px-2 text-xs"
            >
              {isDisconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <UserX className="w-3 h-3" />
              )}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            disabled={isLoading || isConnecting}
            className="h-6 px-2 text-xs"
          >
            {isConnecting ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Twitter className="w-3 h-3 mr-1" />
            )}
            Connect
          </Button>
        )}
      </div>
    );
  }

  // Full card version
  const content = (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Twitter className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">Twitter Integration</CardTitle>
          </div>
          {connectionStatus === 'connected' && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
          {connectionStatus === 'error' && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
        <CardDescription>
          {isConnected
            ? 'Your Twitter account is connected. You can now post and schedule tweets.'
            : 'Connect your Twitter account to post and schedule tweets directly from TweetWiseAI.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Checking connection status...
            </span>
          </div>
        )}

        {/* Connected State */}
        {isConnected && user && !isLoading && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">{user.name}</p>
                <p className="text-sm text-green-700">{user.handle}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>

              {!showDisconnectConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={isDisconnecting}
                  className="flex-1"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <div className="flex space-x-2 flex-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="flex-1"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <UserX className="w-4 h-4 mr-2" />
                    )}
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(false)}
                    disabled={isDisconnecting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disconnected State */}
        {!isConnected && !isLoading && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <Twitter className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Twitter account to unlock posting and scheduling
                features.
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Connecting to Twitter...
                </>
              ) : (
                <>
                  <Twitter className="w-4 h-4 mr-2" />
                  Connect Twitter Account
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You&apos;ll be redirected to Twitter to authorize TweetWiseAI.
              <br />
              We only request permissions to read your profile and post tweets.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Connection Error
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearError}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    Dismiss
                  </Button>
                  {!isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status Info */}
        {connectionStatus === 'connecting' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <p className="text-sm text-blue-900">
                Connecting to Twitter... You may be redirected to complete
                authentication.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );

  if (showCard) {
    return <Card className={className}>{content}</Card>;
  }

  return <div className={className}>{content}</div>;
};

// Simple connection status indicator
export const TwitterConnectionStatus = ({
  className = '',
}: {
  className?: string;
}) => {
  const { isConnected, user, isLoading } = useTwitterAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Checking Twitter...
        </span>
      </div>
    );
  }

  if (isConnected && user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-800">
          Connected as {user.handle}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <AlertCircle className="w-4 h-4 text-orange-500" />
      <span className="text-sm text-orange-700">Twitter not connected</span>
    </div>
  );
};

// Connection required banner
export const TwitterConnectionBanner = ({
  onConnect,
  className = '',
}: {
  onConnect?: () => void;
  className?: string;
}) => {
  const { isConnected, connect, isConnecting } = useTwitterAuth();

  if (isConnected) {
    return null;
  }

  const handleConnect = onConnect || connect;

  return (
    <div
      className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Twitter className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">
              Connect Twitter to unlock posting features
            </p>
            <p className="text-sm text-blue-700">
              Connect your Twitter account to post and schedule tweets directly
              from TweetWiseAI.
            </p>
          </div>
        </div>
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Twitter className="w-4 h-4 mr-2" />
          )}
          Connect
        </Button>
      </div>
    </div>
  );
};
