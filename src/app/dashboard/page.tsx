import { AISuggestions } from '@/components/features/ai-suggestions/ai-suggestions';
import { TweetComposer } from '@/components/features/tweet-composer/tweet-composer';
import { TweetHistory } from '@/components/features/tweet-history/tweet-history';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { authOptions } from '@/lib/auth/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader />

      {/* Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tweet History */}
        <aside className="w-80 border-r bg-muted/50 flex-col hidden md:flex">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Tweet History & Drafts
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <TweetHistory />
          </div>
        </aside>

        {/* Center Panel - Tweet Composer */}
        <main className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Compose Tweet
            </h2>
            <p className="text-xs text-muted-foreground mt-1 md:hidden">
              Use the buttons in the header to access History and AI suggestions
            </p>
          </div>
          <div className="flex-1 p-6">
            <TweetComposer />
          </div>
        </main>

        {/* Right Panel - AI Suggestions */}
        <aside className="w-80 border-l bg-muted/50 flex-col hidden lg:flex">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              AI Suggestions
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <AISuggestions />
          </div>
        </aside>
      </div>
    </div>
  );
} 