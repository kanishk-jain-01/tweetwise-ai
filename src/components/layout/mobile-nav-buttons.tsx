'use client';

import { AISuggestions } from '@/components/features/ai-suggestions/ai-suggestions';
import { TweetHistory } from '@/components/features/tweet-history/tweet-history';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { History, Sparkles } from 'lucide-react';

export const MobileNavButtons = () => {
  // Placeholder handlers - these should be connected to actual state management
  const handleSelectTweet = (tweet: any) => {
    console.log('Selected tweet:', tweet);
    // TODO: Implement tweet selection logic
  };

  const handleAcceptSuggestion = (suggestion: any) => {
    console.log('Accepted suggestion:', suggestion);
    // TODO: Implement suggestion acceptance logic
  };

  const handleRejectSuggestion = (suggestion: any) => {
    console.log('Rejected suggestion:', suggestion);
    // TODO: Implement suggestion rejection logic
  };

  const handleCritique = () => {
    console.log('Critique requested');
    // TODO: Implement critique logic
  };

  return (
    <div className="flex items-center space-x-2 md:hidden">
      {/* History Panel Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Tweet History & Drafts
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <TweetHistory onSelectTweet={handleSelectTweet} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* AI Suggestions Panel Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            AI
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                AI Suggestions
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <AISuggestions
                spellingSuggestions={[]}
                grammarSuggestions={[]}
                critique={null}
                isLoading={false}
                error={null}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onCritique={handleCritique}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
