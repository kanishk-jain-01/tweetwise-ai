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
          className="flex items-center space-x-2 h-9 px-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 rounded-lg border border-transparent hover:border-purple-200/50"
        >
          <Avatar className="h-7 w-7 ring-2 ring-gradient-to-r ring-purple-200 ring-offset-1">
            <AvatarFallback className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold">
              {getUserInitials(session.user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block text-slate-700">
            {getUserDisplayName(session.user.email)}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200" style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-xl rounded-xl p-2"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100/50 mb-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-purple-200">
              <AvatarFallback className="text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold">
                {getUserInitials(session.user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none text-slate-800">
                {getUserDisplayName(session.user.email)}
              </p>
              <p className="text-xs leading-none text-slate-600">
                {session.user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2" />

        <DropdownMenuItem 
          onClick={handleAccountSettings}
          className="p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-200">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-800">Account Settings</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="p-3 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 group-hover:from-red-600 group-hover:to-pink-600 transition-all duration-200">
              <LogOut className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-red-700">Sign Out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
