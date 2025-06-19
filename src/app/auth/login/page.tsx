import { LoginForm } from '@/components/features/auth/login-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In | TweetWiseAI',
  description: 'Sign in to your TweetWiseAI account to start writing better tweets with AI assistance.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your TweetWiseAI account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <LoginForm />
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/auth/register" 
              className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 