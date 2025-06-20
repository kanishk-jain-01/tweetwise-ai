'use client';

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
  error: string | null;
  onAccept: (suggestion: any) => void;
  onReject: (suggestion: any) => void;
  onCritique: () => void;
}

export const DashboardHeader = ({
  onSelectTweet,
  spellingSuggestions,
  grammarSuggestions,
  critique,
  isLoading,
  error,
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

      {/* Mobile Nav + User Menu */}
      <div className="flex items-center space-x-4">
        <MobileNavButtons
          onSelectTweet={onSelectTweet}
          spellingSuggestions={spellingSuggestions}
          grammarSuggestions={grammarSuggestions}
          critique={critique}
          isLoading={isLoading}
          error={error}
          onAccept={onAccept}
          onReject={onReject}
          onCritique={onCritique}
        />
        <UserProfileDropdown />
      </div>
    </header>
  );
};
