# Tasks: X/Twitter API Integration Sprint

## Overview

This sprint implements X/Twitter API integration to allow users to post tweets immediately or schedule them for future posting. The implementation includes OAuth 2.0 authentication flow, database schema updates, and comprehensive UI/UX improvements.

## Relevant Files

- `src/lib/twitter/client.ts` - Twitter API client using twitter-api-v2 library
- `src/lib/twitter/oauth.ts` - OAuth 2.0 authentication flow handlers
- `src/lib/twitter/scheduler.ts` - Tweet scheduling logic and utilities
- `src/app/api/twitter/auth/route.ts` - OAuth authentication API endpoints
- `src/app/api/twitter/post/route.ts` - Tweet posting API endpoint
- `src/app/api/twitter/schedule/route.ts` - Tweet scheduling API endpoint
- `src/app/api/twitter/callback/route.ts` - OAuth callback handler
- `src/components/features/tweet-composer/schedule-modal.tsx` - Tweet scheduling modal component
- `src/components/features/tweet-composer/twitter-connect.tsx` - Twitter account connection component
- `src/components/ui/date-time-picker.tsx` - Date and time picker for scheduling
- `src/hooks/use-twitter-auth.ts` - Twitter authentication state management
- `src/hooks/use-tweet-scheduler.ts` - Tweet scheduling functionality
- `src/lib/database/twitter-schema.ts` - Database schema updates for Twitter integration
- `src/lib/database/twitter-queries.ts` - Database queries for Twitter-related operations
- `src/types/twitter.ts` - TypeScript interfaces for Twitter API responses
- `src/app/api/cron/scheduled-tweets/route.ts` - Cron job for posting scheduled tweets

### Notes

- Database migrations will be needed to update the tweets table schema
- Environment variables must be added for Twitter OAuth credentials
- Vercel Cron jobs will be used for scheduled tweet posting
- The twitter-api-v2 library will be used for Twitter API interactions

## Tasks

- [ ] 1.0 Database Schema & Infrastructure Updates

  - [x] 1.1 Install twitter-api-v2 package and update package.json dependencies
  - [x] 1.2 Create database migration script to add new Twitter-related fields to tweets table
  - [x] 1.3 Update database schema types to include new fields (scheduled_for, tweet_id, sent_at, error_message)
  - [x] 1.4 Add new status values ('scheduled', 'sent') to existing status constraint
  - [x] 1.5 Create Twitter-specific database queries for scheduling and posting operations
  - [x] 1.6 Update existing tweet queries to handle new status types and fields

- [ ] 2.0 Twitter API Client & Authentication Setup

  - [ ] 2.1 Create Twitter API client wrapper using twitter-api-v2 library
  - [ ] 2.2 Implement OAuth 2.0 PKCE flow for Twitter authentication
  - [ ] 2.3 Create secure token storage and refresh mechanism
  - [ ] 2.4 Add Twitter OAuth credentials to environment variables and env.example
  - [ ] 2.5 Create Twitter authentication state management hook
  - [ ] 2.6 Implement Twitter account connection/disconnection functionality

- [ ] 3.0 Tweet Posting & Scheduling API Endpoints

  - [ ] 3.1 Create /api/twitter/auth endpoint for initiating OAuth flow
  - [ ] 3.2 Create /api/twitter/callback endpoint for handling OAuth callback
  - [ ] 3.3 Create /api/twitter/post endpoint for immediate tweet posting
  - [ ] 3.4 Create /api/twitter/schedule endpoint for scheduling tweets
  - [ ] 3.5 Add proper authentication middleware for Twitter API endpoints
  - [ ] 3.6 Implement request validation using Zod schemas for all endpoints

- [ ] 4.0 UI/UX Components & Modal Implementation

  - [ ] 4.1 Create date-time picker component with minute-level precision
  - [ ] 4.2 Build tweet scheduling modal with immediate/scheduled options
  - [ ] 4.3 Create Twitter account connection component with OAuth flow
  - [ ] 4.4 Design and implement scheduling confirmation dialog
  - [ ] 4.5 Add Twitter connection status indicator to dashboard
  - [ ] 4.6 Create loading states and progress indicators for Twitter operations

- [ ] 5.0 Tweet Composer Integration & Button Updates

  - [ ] 5.1 Replace "Complete Tweet" button with "Schedule/Send Tweet" button
  - [ ] 5.2 Integrate scheduling modal with tweet composer component
  - [ ] 5.3 Add Twitter connection check before allowing tweet posting
  - [ ] 5.4 Update tweet composer to handle immediate vs scheduled posting
  - [ ] 5.5 Add character count validation specific to Twitter's limits
  - [ ] 5.6 Implement tweet composer state management for scheduling

- [ ] 6.0 Tweet History & Status Management Updates

  - [ ] 6.1 Update tweet history UI to show new status types (scheduled, sent)
  - [ ] 6.2 Change "Completed" filter to "Scheduled/Sent Tweets" in left sidebar
  - [ ] 6.3 Add status badges for scheduled vs sent tweets
  - [ ] 6.4 Display scheduled time and sent time in tweet cards
  - [ ] 6.5 Add Twitter-specific actions (view on Twitter, reschedule, cancel)
  - [ ] 6.6 Implement error state display for failed tweet posts

- [ ] 7.0 Scheduled Tweet Processing & Cron Jobs

  - [ ] 7.1 Create /api/cron/scheduled-tweets endpoint for processing scheduled tweets
  - [ ] 7.2 Implement scheduled tweet retrieval and posting logic
  - [ ] 7.3 Add Vercel cron configuration for automated tweet posting
  - [ ] 7.4 Create tweet scheduling utility functions and helpers
  - [ ] 7.5 Implement retry logic for failed scheduled tweets
  - [ ] 7.6 Add logging and monitoring for scheduled tweet processing

- [ ] 8.0 Error Handling & User Feedback

  - [ ] 8.1 Create comprehensive error handling for Twitter API failures
  - [ ] 8.2 Implement user-friendly error messages for common Twitter API errors
  - [ ] 8.3 Add success notifications for successful tweet posting and scheduling
  - [ ] 8.4 Create error recovery mechanisms (retry, reschedule options)
  - [ ] 8.5 Implement rate limiting awareness and user feedback
  - [ ] 8.6 Add validation for tweet content and scheduling constraints

- [ ] 9.0 Testing & Integration Validation
  - [ ] 9.1 Test OAuth flow end-to-end with Twitter developer account
  - [ ] 9.2 Validate immediate tweet posting functionality
  - [ ] 9.3 Test scheduled tweet processing and cron job execution
  - [ ] 9.4 Verify database operations and data integrity
  - [ ] 9.5 Test error scenarios and edge cases
  - [ ] 9.6 Perform UI/UX testing across different screen sizes and devices
