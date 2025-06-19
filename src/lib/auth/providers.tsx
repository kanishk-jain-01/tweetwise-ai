'use client';

import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { createContext, ReactNode, useContext } from 'react';

// NextAuth Session Provider wrapper
interface AuthProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}

// User Context for additional user-related state
interface UserContextType {
  preferences: {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
    aiSuggestions: boolean;
  };
  updatePreferences: (preferences: Partial<UserContextType['preferences']>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  // This could be expanded to load user preferences from database
  const defaultPreferences = {
    theme: 'light' as const,
    emailNotifications: true,
    aiSuggestions: true,
  };

  const updatePreferences = (newPreferences: Partial<UserContextType['preferences']>) => {
    // In a real app, this would update the database
    console.log('Updating preferences:', newPreferences);
    // For now, just log the update
  };

  const value: UserContextType = {
    preferences: defaultPreferences,
    updatePreferences,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Combined provider for easy setup
interface ProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <AuthProvider session={session}>
      <UserProvider>
        {children}
      </UserProvider>
    </AuthProvider>
  );
} 