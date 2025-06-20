'use client';

import { MobileNavButtons } from './mobile-nav-buttons';
import { UserProfileDropdown } from './user-profile-dropdown';

export const DashboardHeader = () => {
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-semibold">TweetWiseAI</h1>
      </div>

      {/* Mobile Nav + User Menu */}
      <div className="flex items-center space-x-4">
        <MobileNavButtons />
        <UserProfileDropdown />
      </div>
    </header>
  );
}; 