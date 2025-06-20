'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

export const UserProfileDropdown = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleAccountSettings = () => {
    // TODO: Navigate to account settings page
    // TODO: Navigate to account settings
    // console.log('Navigate to account settings');
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = (email: string) => {
    // Extract name from email (before @) and capitalize
    const name = email.split('@')[0];
    if (!name) return email; // Fallback to email if name extraction fails
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (!session?.user?.email) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 h-9 px-2"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">
              {getUserInitials(session.user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block">
            {getUserDisplayName(session.user.email)}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName(session.user.email)}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleAccountSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
