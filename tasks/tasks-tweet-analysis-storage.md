# Tasks: Tweet Analysis Database Storage & Persistence

## Relevant Files

- `src/lib/database/ai-queries.ts` - New database query layer for AI response operations with update/create functionality
- `src/app/api/ai/critique/route.ts` - Existing critique API endpoint that needs database storage integration  
- `src/app/api/ai/analysis/[tweetId]/route.ts` - New API endpoint for retrieving tweet analysis data
- `src/hooks/use-ai-suggestions.ts` - Existing hook that needs database loading capabilities
- `src/components/features/ai-suggestions/ai-suggestions.tsx` - Existing component for displaying analysis
- `src/hooks/use-tweet-composer.ts` - Existing composer hook that needs to trigger analysis loading
- `src/types/index.ts` - Type definitions for analysis data structures

### Notes

- The existing `ai_responses` table in the database schema works perfectly - no schema changes needed
- Current in-memory caching will be kept as a secondary performance layer
- Analysis will be updated (not versioned) - one analysis per tweet per type
- Each tweet gets its own analysis tied to the specific tweet ID
- Simpler approach: no version history, just current analysis per tweet

## Tasks

- [x] 1.0 Create AI Response Database Query Layer
  - [x] 1.1 Create `src/lib/database/ai-queries.ts` with `AIResponseQueries` class structure
  - [x] 1.2 Implement `saveAnalysis(tweetId, type, responseData)` method to create/update analysis
  - [x] 1.3 Implement `getAnalysis(tweetId, type)` method to retrieve current analysis
  - [x] 1.4 Implement `getAnalysisById(analysisId)` method for specific analysis retrieval
  - [x] 1.5 Implement `deleteAnalysisForTweet(tweetId)` method for cleanup operations
  - [x] 1.6 Implement `getAvailableAnalysisTypes(tweetId)` method to get analysis types for tweet
  - [x] 1.7 Add TypeScript interfaces for analysis data structures
  - [x] 1.8 Add comprehensive error handling and logging for all database operations

- [x] 2.0 Enhance Critique API for Database Storage and Persistence
  - [x] 2.1 Update critique API route to accept `tweetId` parameter in request body
  - [x] 2.2 Integrate database-first lookup for existing analysis before OpenAI calls
  - [x] 2.3 Integrate `AIResponseQueries.saveAnalysis()` to store/update analysis after OpenAI calls
  - [x] 2.4 Update response format to include analysis metadata (ID, timestamp)
  - [x] 2.5 Maintain in-memory cache as secondary performance layer
  - [x] 2.6 Add error handling for database operations with fallback to in-memory cache
  - [x] 2.7 Create new API endpoint `/api/ai/analysis/[tweetId]/route.ts` for analysis retrieval
  - [x] 2.8 Implement GET method to retrieve analysis data for a tweet
  - [x] 2.9 Add proper authentication and authorization checks for analysis endpoints

- [x] 3.0 Build Analysis Database Integration in AI Suggestions Hook
  - [x] 3.1 Add `analysisLoading` state for database analysis loading operations
  - [x] 3.2 Add `analysisMetadata` state to track analysis ID and timestamp
  - [x] 3.3 Implement `loadExistingAnalysis(tweetId)` function to fetch tweet's stored analysis
  - [x] 3.4 Update `requestCritique` function to accept `tweetId` and store analysis in database
  - [x] 3.5 Add event listener for `contentLoading` events to trigger analysis loading
  - [x] 3.6 Update `clearSuggestions` to also clear analysis metadata
  - [x] 3.7 Add error handling for analysis loading and storage operations
  - [x] 3.8 Update response handling to include analysis metadata (ID, timestamp)
  - [x] 3.9 Add state management for distinguishing between new and existing analysis

- [x] 4.0 Enhance Analysis Display with Metadata
  - [x] 4.1 Add analysis timestamp display in `ai-suggestions.tsx` component
  - [x] 4.2 Show "Saved" indicator when analysis is stored in database
  - [x] 4.3 Add "Re-analyze" button to refresh stored analysis
  - [x] 4.4 Display loading state when fetching existing analysis from database
  - [x] 4.5 Style metadata display to match existing design system (shadcn/ui)
  - [x] 4.6 Add loading states for analysis operations
  - [x] 4.7 Show different states for new vs existing analysis
  - [x] 4.8 Add accessibility features (ARIA labels, screen reader support)
  - [x] 4.9 Integrate metadata display seamlessly with existing analysis UI
  - [x] 4.10 Fix Re-analyze button functionality to force fresh analysis instead of returning cached results

- [x] 5.0 Integrate Analysis Loading with Tweet Composer System
  - [x] 5.1 Update `loadDraft()` in `useTweetComposer` to trigger analysis loading
  - [x] 5.2 Modify `contentLoading` event to include tweet ID in event detail
  - [x] 5.3 Update dashboard page to pass `currentTweetId` to critique requests
  - [x] 5.4 Handle cases where `currentTweetId` is null for new unsaved tweets
  - [x] 5.5 Ensure analysis loading works for all tweet types (drafts, scheduled, sent)
  - [x] 5.6 Add loading states during analysis retrieval when switching tweets
  - [x] 5.7 Clear analysis when starting a new tweet composition
  - [x] 5.8 Test integration with auto-save functionality for new tweet ID assignment (✅ Working as expected)
  - [x] 5.9 Add error handling for failed analysis loading operations (✅ Already implemented)