'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = !!session && status === 'authenticated';
  const user = session?.user;

  const logout = async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: '/auth/login',
      });
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return false;
    }
    return true;
  };

  const redirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
      return true;
    }
    return false;
  };

  return {
    // Session data
    session,
    user,

    // Status flags
    isLoading,
    isAuthenticated,
    isUnauthenticated: !isLoading && !isAuthenticated,

    // Actions
    logout,

    // Utilities
    requireAuth,
    redirectIfAuthenticated,
  };
};
