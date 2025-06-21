'use client';

import { AISuggestions } from '@/components/features/ai-suggestions/ai-suggestions';
import { TweetHistory } from '@/components/features/tweet-history/tweet-history';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { History, Sparkles } from 'lucide-react';

interface MobileNavButtonsProps {
  // Tweet History props
  onSelectTweet: (tweet: any) => void;

  // AI Suggestions props
  spellingSuggestions: any[];
  grammarSuggestions: any[];
  critique: any;
  isLoading: boolean;
  error: string | null;
  onAccept: (suggestion: any) => void;
  onReject: (suggestion: any) => void;
  onCritique: () => void;
}

export const MobileNavButtons = ({
  onSelectTweet,
  spellingSuggestions,
  grammarSuggestions,
  critique,
  isLoading,
  error,
  onAccept,
  onReject,
  onCritique,
}: MobileNavButtonsProps) => {
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
              <TweetHistory onSelectTweet={onSelectTweet} />
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
                spellingSuggestions={spellingSuggestions}
                grammarSuggestions={grammarSuggestions}
                critique={critique}
                isLoading={isLoading}
                error={error}
                onAccept={onAccept}
                onReject={onReject}
                onCritique={onCritique}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
