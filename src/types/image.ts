/**
 * Image-related TypeScript interfaces for TweetWise AI
 * Comprehensive type definitions for AI image generation and management
 */

import type { ImageStyle } from '@/lib/database/schema';

// Core image interfaces
export interface Image {
  id: string;
  tweet_id: string | null;
  base64_data: string;
  prompt: string;
  style: ImageStyle;
  size: string;
  format: string;
  quality: string;
  generation_time_ms: number;
  file_size_bytes: number;
  created_at: string;
  updated_at?: string;
}

export interface GeneratedImage {
  id?: string;
  base64Data: string;
  prompt: string;
  style: ImageStyle;
  generationTimeMs: number;
  fileSizeBytes: number;
  savedToDatabase: boolean;
}

export interface UploadedImage {
  base64Data: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
}

// Image generation request/response interfaces
export interface ImageGenerationRequest {
  tweetContent: string;
  tweetId?: string | null;
  style: ImageStyle;
  size?: string;
  quality?: 'low' | 'medium' | 'high';
}

export interface ImageGenerationResponse {
  success: boolean;
  image?: GeneratedImage;
  metadata?: {
    generationTime: string;
    fileSize: string;
    promptUsed: string;
  };
  error?: string;
  message?: string;
}

// Database operation interfaces
export interface CreateImageData {
  tweet_id?: string | null;
  base64_data: string;
  prompt: string;
  style: ImageStyle;
  size: string;
  format: string;
  quality: string;
  generation_time_ms: number;
  file_size_bytes: number;
}

export interface UpdateImageData {
  tweet_id?: string | null;
  base64_data?: string;
  prompt?: string;
  style?: ImageStyle;
  size?: string;
  format?: string;
  quality?: string;
  generation_time_ms?: number;
  file_size_bytes?: number;
}

// Image state management interfaces
export interface ImageState {
  currentImage: GeneratedImage | null;
  uploadedImage: UploadedImage | null;
  isGenerating: boolean;
  isUploading: boolean;
  isLoadingTweet: boolean;
  generationProgress: number;
  generationMessage: string;
  estimatedTimeRemaining: number;
  error: string | null;
}

export interface ImageActions {
  generateImage: (request: ImageGenerationRequest) => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  removeImage: () => void;
  deleteImage: (tweetId?: string) => Promise<boolean>;
  loadImageForTweet: (tweetId: string) => Promise<void>;
  clearImageState: () => void;
}

// Tweet with image relationship
export interface TweetWithImage {
  id: string;
  user_id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  created_at: string;
  updated_at?: string;
  scheduled_for?: string;
  sent_at?: string;
  tweet_id?: string;
  image?: Image | null;
  hasImage?: boolean;
}

// Image validation and processing
export interface ImageValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImageProcessingOptions {
  maxSize: number; // in bytes
  allowedFormats: string[];
  maxDimensions: {
    width: number;
    height: number;
  };
}

// Image metadata for display
export interface ImageMetadata {
  id?: string;
  type: 'generated' | 'uploaded';
  style?: ImageStyle;
  generationTime?: number;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format: string;
  createdAt: Date;
  prompt?: string;
}

// Hook return interface
export interface UseImageGenerationReturn {
  // State
  state: ImageState;
  
  // Actions
  actions: ImageActions;
  
  // Computed properties
  hasImage: boolean;
  displayImage: string | null;
  imageMetadata: ImageMetadata | null;
  canGenerate: boolean;
  canUpload: boolean;
  
  // Validation
  validateImageFile: (file: File) => ImageValidation;
  
  // Utilities
  getImagePreviewUrl: () => string | null;
  getImageForTwitter: () => string | null;
  formatFileSize: (bytes: number) => string;
  formatGenerationTime: (ms: number) => string;
}

// Twitter integration interfaces
export interface TwitterImageUpload {
  media_id: string;
  size: number;
  expires_after_secs?: number;
}

export interface TwitterImageUploadRequest {
  base64Data: string;
  mediaType: string;
  additionalOwners?: string[];
}

// Image processing utilities
export interface ImageProcessor {
  convertToBase64: (file: File) => Promise<string>;
  validateFile: (file: File) => ImageValidation;
  optimizeForTwitter: (base64Data: string) => Promise<string>;
  extractMetadata: (base64Data: string) => Promise<ImageMetadata>;
}

// Error handling
export interface ImageError {
  type: 'generation' | 'upload' | 'validation' | 'database' | 'twitter' | 'deletion';
  message: string;
  details?: any;
  retryable: boolean;
}

// Constants and configurations
export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_DIMENSIONS: {
    width: 4096,
    height: 4096
  },
  GENERATION_TIMEOUT: 60000, // 60 seconds
  UPLOAD_TIMEOUT: 30000, // 30 seconds
} as const;

export const STYLE_CONFIG = {
  ghibli: {
    name: 'Studio Ghibli',
    description: 'Whimsical, hand-drawn animation style',
    icon: '🌸',
    promptPrefix: 'Studio Ghibli style, whimsical animation art, '
  },
  photo_realistic: {
    name: 'Photo Realistic',
    description: 'High-quality photorealistic images',
    icon: '📸',
    promptPrefix: 'Photorealistic, high quality, professional photography, '
  }
} as const;

// Re-export commonly used types
export type { ImageStyle } from '@/lib/database/schema';
