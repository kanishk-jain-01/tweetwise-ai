'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Critique, Suggestion } from '@/hooks/use-ai-suggestions';
import {
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wand2,
} from 'lucide-react';

interface AISuggestionsProps {
  spellingSuggestions: Suggestion[];
  grammarSuggestions: Suggestion[];
  critique: Critique | null;
  isLoading: boolean;
  error: string | null;
  onAccept: (suggestion: Suggestion) => void;
  onReject: (suggestion: Suggestion) => void;
  onCritique: () => void;
}

export const AISuggestions = ({
  spellingSuggestions,
  grammarSuggestions,
  critique,
  isLoading,
  error,
  onAccept,
  onReject,
  onCritique,
}: AISuggestionsProps) => {
  const hasSuggestions =
    spellingSuggestions.length > 0 || grammarSuggestions.length > 0;

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-sm text-destructive flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              AI Assistant Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* AI Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Wand2 className="w-4 h-4" />
                  <span>AI Assistant</span>
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? 'Analyzing your tweet...'
                    : hasSuggestions
                      ? 'Found suggestions for improvement'
                      : 'Your tweet looks good! Type to get real-time feedback.'}
                </p>
              </CardContent>
            </Card>

            {/* Spelling Suggestions */}
            {spellingSuggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Spelling</span>
                    <Badge variant="destructive" className="text-xs">
                      {spellingSuggestions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {spellingSuggestions.map((suggestion, index) => (
                    <div key={suggestion.id} className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Replace </span>
                        <span className="bg-red-100 text-red-800 px-1 rounded">
                          {suggestion.original}
                        </span>
                        <span className="text-muted-foreground"> with </span>
                        <span className="bg-green-100 text-green-800 px-1 rounded">
                          {suggestion.suggestion}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAccept(suggestion)}
                          disabled={isLoading}
                          className="h-7 text-xs"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReject(suggestion)}
                          disabled={isLoading}
                          className="h-7 text-xs"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                      {index < spellingSuggestions.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Grammar Suggestions */}
            {grammarSuggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span>Grammar</span>
                    <Badge variant="secondary" className="text-xs">
                      {grammarSuggestions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {grammarSuggestions.map((suggestion, index) => (
                    <div key={suggestion.id} className="space-y-2">
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">
                          {suggestion.explanation}
                        </p>
                        <div>
                          <span className="text-muted-foreground">Change </span>
                          <span className="bg-yellow-100 text-yellow-800 px-1 rounded">
                            {suggestion.original}
                          </span>
                          <span className="text-muted-foreground"> to </span>
                          <span className="bg-green-100 text-green-800 px-1 rounded">
                            {suggestion.suggestion}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAccept(suggestion)}
                          disabled={isLoading}
                          className="h-7 text-xs"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReject(suggestion)}
                          disabled={isLoading}
                          className="h-7 text-xs"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                      {index < grammarSuggestions.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Tweet Critique */}
            {critique && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Tweet Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Engagement Score
                      </span>
                      <Badge variant="outline">
                        {critique.engagementScore}/10
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Clarity
                      </span>
                      <Badge variant="outline">{critique.clarity}/10</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Tone
                      </span>
                      <Badge variant="outline">{critique.tone}</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Suggestions
                    </h4>
                    <ul className="text-sm space-y-1">
                      {critique.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Critique Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCritique}
              disabled={isLoading}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {critique ? 'Refresh Analysis' : 'Analyze Tweet'}
            </Button>

            {/* No Suggestions State */}
            {!hasSuggestions && !critique && !isLoading && (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No issues found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Start typing to get real-time suggestions
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
