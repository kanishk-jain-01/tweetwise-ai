# Tasks: AI Image Generation Feature

## Feature Overview
Add AI image generation capability to TweetWise AI using OpenAI's gpt-image-1 model. Users can generate images based on tweet content with Ghibli and Photo Realistic style options. Images are stored as base64 in database and uploaded to Twitter during posting.

## Relevant Files

- `src/lib/database/schema.ts` - Add images table schema and types
- `src/lib/database/migrations/005-add-images-table.ts` - Database migration for images table
- `src/lib/database/image-queries.ts` - Database operations for image management
- `src/lib/ai/image-generation.ts` - OpenAI gpt-image-1 service integration
- `src/app/api/ai/generate-image/route.ts` - API endpoint for image generation
- `src/components/features/tweet-composer/image-panel.tsx` - Image generation/upload UI component
- `src/components/features/tweet-composer/tweet-composer.tsx` - Updated composer with dual-panel layout
- `src/hooks/use-image-generation.ts` - Custom hook for image generation state management
- `src/app/api/twitter/post/route.ts` - Updated to handle image uploads to Twitter
- `src/lib/twitter/media-upload.ts` - Twitter media API integration utilities
- `src/types/image.ts` - TypeScript interfaces for image-related types

### Notes

- gpt-image-1 returns base64 images directly, simplifying storage
- Images will be stored in database as base64 with comprehensive metadata
- Twitter media upload requires converting base64 back to binary format
- Composer UI will be split into left (text) and right (image) panels

## Tasks

- [x] 1.0 Database Schema & Image Storage
  - [x] 1.1 Create images table schema in `src/lib/database/schema.ts` with fields for id, tweet_id, base64_data, metadata (prompt, style, size, format), created_at
  - [x] 1.2 Create database migration file `005-add-images-table.ts` with CREATE TABLE statement and indexes
  - [x] 1.3 Update TypeScript interfaces to include Image type and extend Tweet type with optional image relationship
  - [x] 1.4 Create `src/lib/database/image-queries.ts` with CRUD operations (save, get, delete, update)
  - [x] 1.5 Run migration to create images table in database

- [x] 2.0 OpenAI gpt-image-1 Integration & Service Layer
  - [x] 2.1 Create `src/lib/ai/image-generation.ts` service with gpt-image-1 API integration
  - [x] 2.2 Implement style prompt templates for "Ghibli" and "Photo Realistic" styles
  - [x] 2.3 Create function to generate image prompts from tweet content automatically
  - [x] 2.4 Add error handling and response validation for OpenAI API calls
  - [x] 2.5 Create API endpoint `src/app/api/ai/generate-image/route.ts` with POST handler
  - [x] 2.6 Add authentication and rate limiting to image generation endpoint

- [ ] 3.0 Composer UI Redesign & Image Panel
  - [x] 3.1 Create `src/components/features/tweet-composer/image-panel.tsx` component
  - [x] 3.2 Design image panel UI with "Generate AI Image" and "Upload Image" options
  - [x] 3.3 Add style selector dropdown (Ghibli, Photo Realistic) for AI generation
  - [x] 3.4 Implement image preview display with base64 rendering
  - [x] 3.5 Update `tweet-composer.tsx` to use dual-panel layout (text left, image right)
  - [ ] 3.6 Add responsive design for mobile devices (stack panels vertically)
  - [x] 3.7 Create loading states and progress indicators for image generation
  - [x] 3.8 Add image removal/replace functionality

- [ ] 4.0 Image Management & Tweet Integration
  - [x] 4.1 Create `src/hooks/use-image-generation.ts` custom hook for state management
  - [x] 4.2 Create `src/types/image.ts` with comprehensive TypeScript interfaces
  - [x] 4.3 Implement automatic image-tweet association when images are generated
  - [ ] 4.4 Update tweet history to display image thumbnails/indicators
  - [x] 4.5 Implement image loading when switching between tweets in history
  - [x] 4.6 Add image persistence across browser sessions with draft tweets
  - [x] 4.7 Handle image deletion when tweets are deleted
  - [ ] 4.8 Add image metadata display (generation time, style used, etc.)

- [x] 5.0 Twitter Media API Integration
  - [ ] 5.1 Create `src/lib/twitter/media-upload.ts` utility for Twitter media API
  - [ ] 5.2 Implement base64 to binary conversion for Twitter upload format
  - [ ] 5.3 Update `src/app/api/twitter/post/route.ts` to handle image uploads
  - [ ] 5.4 Add media_ids parameter to tweet posting API calls
  - [ ] 5.5 Implement error handling for Twitter media upload failures
  - [ ] 5.6 Add image format validation and optimization for Twitter requirements
  - [ ] 5.7 Test end-to-end tweet posting with generated images
  - [ ] 5.8 Update tweet status tracking to include media upload success/failure 