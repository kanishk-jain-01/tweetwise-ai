import { authOptions } from '@/lib/auth/auth';
import { Providers } from '@/lib/auth/providers';
import type { Metadata } from 'next';
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
  title: 'TweetWiseAI - Write Better Tweets with AI',
  description:
    'Enhance your Twitter content with AI-powered grammar checking, spell checking, and tweet analysis. Write better, more engaging tweets with TweetWiseAI.',
  keywords:
    'Twitter, AI, writing, grammar, spell check, social media, content creation',
  authors: [{ name: 'TweetWiseAI Team' }],
  viewport: 'width=device-width, initial-scale=1',
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
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
