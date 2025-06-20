import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';
import { authOptions } from '@/lib/auth/auth';
import { Providers } from '@/lib/auth/providers';
import type { Metadata, Viewport } from 'next';
import { getServerSession } from 'next-auth';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tweetwise-ai.vercel.app'),
  title: {
    default: 'TweetWiseAI - AI-Powered Tweet Enhancement',
    template: `%s | TweetWiseAI`,
  },
  description:
    'Elevate your Twitter game with AI-powered grammar checks, spell checks, content critiques, and curation assistance. Write perfect tweets, every time.',
  keywords: [
    'Twitter',
    'AI writer',
    'tweet assistant',
    'grammar check',
    'spell check',
    'social media tool',
    'content creation',
    'engagement',
  ],
  authors: [{ name: 'TweetWiseAI Team', url: 'https://tweetwise-ai.vercel.app' }],
  creator: 'TweetWiseAI Team',
  openGraph: {
    title: 'TweetWiseAI - AI-Powered Tweet Enhancement',
    description: 'Write perfect tweets with AI-powered grammar checks, critiques, and more.',
    url: 'https://tweetwise-ai.vercel.app',
    siteName: 'TweetWiseAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TweetWiseAI Banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TweetWiseAI - AI-Powered Tweet Enhancement',
    description: 'Write perfect tweets with AI-powered grammar checks, critiques, and more.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <Providers session={session}>
          <main className="flex-1">{children}</main>
        </Providers>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
