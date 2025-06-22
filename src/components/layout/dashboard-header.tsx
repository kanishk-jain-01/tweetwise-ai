'use client';

import { TwitterConnectionStatus } from '@/components/features/tweet-composer/twitter-connect';
import { Brain, Sparkles } from 'lucide-react';
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
    <header className="h-14 border-b border-slate-200/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 flex items-center justify-between px-6">
      {/* Logo with gradient branding */}
      <div className="flex items-center space-x-2 group transition-all duration-300">
        {/* AI Icon with gradient background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-1.5 rounded-lg">
            <Brain className="h-4 w-4 text-white" />
          </div>
        </div>
        
        {/* Brand name with gradient text */}
        <div className="flex items-center space-x-1">
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            TweetWise
          </span>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            AI
          </span>
          <Sparkles className="h-3 w-3 text-purple-500 ml-1" />
        </div>
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
