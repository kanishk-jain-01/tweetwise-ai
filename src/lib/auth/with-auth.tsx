'use client';

import { LoadingSpinner } from '@/components/ui/loading';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ComponentType, useEffect } from 'react';

interface WithAuthProps {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthProps = {}
) {
  const { redirectTo = '/auth/login', redirectIfAuthenticated = false } =
    options;

  return function AuthenticatedComponent(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return; // Still loading

      const isAuthenticated = !!session;

      if (redirectIfAuthenticated && isAuthenticated) {
        router.push('/dashboard');
        return;
      }

      if (!redirectIfAuthenticated && !isAuthenticated) {
        router.push(redirectTo);
        return;
      }
    }, [session, status, router]);

    // Show loading spinner while checking authentication
    if (status === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    // If redirectIfAuthenticated is true and user is authenticated, don't render
    if (redirectIfAuthenticated && session) {
      return null;
    }

    // If redirectIfAuthenticated is false and user is not authenticated, don't render
    if (!redirectIfAuthenticated && !session) {
      return null;
    }

    // Render the wrapped component
    return <WrappedComponent {...props} />;
  };
}

// Convenience function for protecting dashboard pages
export const withDashboardAuth = <P extends object>(
  WrappedComponent: ComponentType<P>
) => withAuth(WrappedComponent, { redirectTo: '/auth/login' });

// Convenience function for auth pages (redirect if already authenticated)
export const withGuestOnly = <P extends object>(
  WrappedComponent: ComponentType<P>
) =>
  withAuth(WrappedComponent, {
    redirectTo: '/dashboard',
    redirectIfAuthenticated: true,
  });
