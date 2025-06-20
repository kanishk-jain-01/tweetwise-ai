import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';

// Get current session on server side
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

// Get current user from session
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user;
}

// Require authentication for server components
export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/auth/login');
  }

  return session;
}

// Require guest (no authentication) for server components
export async function requireGuest() {
  const session = await getCurrentSession();

  if (session) {
    redirect('/dashboard');
  }
}

// Check if user is authenticated without redirecting
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return !!session;
}

// Get user ID from session
export async function getCurrentUserId() {
  const session = await getCurrentSession();
  return session?.user?.id;
}

// Type-safe session with user data
export type AuthenticatedSession = NonNullable<
  Awaited<ReturnType<typeof getCurrentSession>>
>;
export type AuthenticatedUser = AuthenticatedSession['user'];
