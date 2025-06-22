'use client';

import { TwitterConnectionStatus } from '@/components/features/tweet-composer/twitter-connect';
import { MobileNavButtons } from './mobile-nav-buttons';
import { UserProfileDropdown } from './user-profile-dropdown';

interface DashboardHeaderProps {
  // Tweet History props
  onSelectTweet: (tweet: any) => void;

  // AI Suggestions props
  spellingSuggestions: any[];
  grammarSuggestions: any[];
  critique: any;
  isLoading: boolean;
  analysisLoading: boolean;
  error: string | null;
  analysisMetadata: any;
  onAccept: (suggestion: any) => void;
  onReject: (suggestion: any) => void;
  onCritique: (forceRefresh?: boolean) => void;
}

export const DashboardHeader = ({
  onSelectTweet,
  spellingSuggestions,
  grammarSuggestions,
  critique,
  isLoading,
  analysisLoading,
  error,
  analysisMetadata,
  onAccept,
  onReject,
  onCritique,
}: DashboardHeaderProps) => {
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-semibold">TweetWiseAI</h1>
      </div>

      {/* Center - Twitter Connection Status */}
      <div className="hidden md:flex flex-1 justify-center">
        <TwitterConnectionStatus />
      </div>

      {/* Mobile Nav + User Menu */}
      <div className="flex items-center space-x-4">
        {/* Mobile Twitter Status */}
        <div className="md:hidden">
          <TwitterConnectionStatus className="scale-90" />
        </div>
        <MobileNavButtons
          onSelectTweet={onSelectTweet}
          spellingSuggestions={spellingSuggestions}
          grammarSuggestions={grammarSuggestions}
          critique={critique}
          isLoading={isLoading}
          analysisLoading={analysisLoading}
          error={error}
          analysisMetadata={analysisMetadata}
          onAccept={onAccept}
          onReject={onReject}
          onCritique={onCritique}
        />
        <UserProfileDropdown />
      </div>
    </header>
  );
};
