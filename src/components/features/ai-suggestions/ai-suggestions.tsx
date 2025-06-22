'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisMetadata, Critique, Suggestion } from '@/hooks/use-ai-suggestions';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Database,
    Lightbulb,
    Loader2,
    RefreshCw,
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
  analysisLoading: boolean;
  error: string | null;
  analysisMetadata: AnalysisMetadata | null;
  onAccept: (suggestion: Suggestion) => void;
  onReject: (suggestion: Suggestion) => void;
  onCritique: (forceRefresh?: boolean) => void;
}

export const AISuggestions = ({
  spellingSuggestions,
  grammarSuggestions,
  critique,
  isLoading,
  analysisLoading,
  error,
  analysisMetadata,
  onAccept,
  onReject,
  onCritique,
}: AISuggestionsProps) => {
  const hasSuggestions =
    spellingSuggestions.length > 0 || grammarSuggestions.length > 0;

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

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
                  {(isLoading || analysisLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? 'Analyzing your tweet...'
                    : analysisLoading
                      ? 'Loading existing analysis...'
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
                          disabled={isLoading || analysisLoading}
                          className="h-7 text-xs"
                          aria-label={`Accept spelling suggestion: Replace "${suggestion.original}" with "${suggestion.suggestion}"`}
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReject(suggestion)}
                          disabled={isLoading || analysisLoading}
                          className="h-7 text-xs"
                          aria-label={`Reject spelling suggestion for "${suggestion.original}"`}
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
                          disabled={isLoading || analysisLoading}
                          className="h-7 text-xs"
                          aria-label={`Accept grammar suggestion: ${suggestion.explanation}`}
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReject(suggestion)}
                          disabled={isLoading || analysisLoading}
                          className="h-7 text-xs"
                          aria-label={`Reject grammar suggestion: ${suggestion.explanation}`}
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

            {/* Tweet Critique with Enhanced Metadata Display */}
            {(critique || analysisLoading) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Tweet Analysis</span>
                      {analysisLoading && (
                        <Badge variant="outline" className="text-xs flex items-center space-x-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading...</span>
                        </Badge>
                      )}
                      {!analysisLoading && analysisMetadata?.isFromDatabase && (
                        <Badge variant="outline" className="text-xs flex items-center space-x-1">
                          <Database className="w-3 h-3" />
                          <span>Saved</span>
                        </Badge>
                      )}
                    </div>
                    {!analysisLoading && analysisMetadata?.created_at && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(analysisMetadata.created_at)}</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {analysisLoading && !critique ? (
                    // Loading skeleton for analysis retrieval
                    <div className="space-y-3" role="status" aria-label="Loading analysis">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      </div>
                    </div>
                  ) : critique ? (
                    // Actual critique content
                    <>
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
                        <ul className="text-sm space-y-1" role="list">
                          {critique.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start space-x-2" role="listitem">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Analysis Metadata Footer */}
                      {analysisMetadata && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              {analysisMetadata.isFromDatabase ? (
                                <>
                                  <Database className="w-3 h-3" />
                                  <span>Stored in database</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  <span>New analysis</span>
                                </>
                              )}
                            </div>
                            {analysisMetadata.id && (
                              <span className="font-mono text-xs opacity-50">
                                ID: {analysisMetadata.id.slice(-8)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Enhanced Request Critique Button with Re-analyze Option */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCritique(critique ? true : false)}
                disabled={isLoading || analysisLoading}
                className="w-full"
                aria-label={critique ? 'Re-analyze tweet for updated suggestions' : 'Analyze tweet for engagement and clarity suggestions'}
              >
                {analysisLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading Analysis...
                  </>
                ) : critique ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-analyze Tweet
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Tweet
                  </>
                )}
              </Button>
              
              {/* Loading State for Database Operations */}
              {analysisLoading && !isLoading && (
                <div className="text-xs text-muted-foreground text-center flex items-center justify-center space-x-1">
                  <Database className="w-3 h-3" />
                  <span>Fetching stored analysis...</span>
                </div>
              )}
            </div>

            {/* No Suggestions State */}
            {!hasSuggestions && !critique && !isLoading && !analysisLoading && (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" aria-hidden="true" />
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
