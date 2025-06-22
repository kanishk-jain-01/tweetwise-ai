/**
 * Custom hook for image generation state management
 * Handles AI image generation, file uploads, and image persistence
 */

import type {
  GeneratedImage,
  ImageError,
  ImageGenerationRequest,
  ImageMetadata,
  ImageState,
  ImageValidation,
  UploadedImage,
  UseImageGenerationReturn
} from '@/types/image';
import { IMAGE_CONFIG } from '@/types/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Generation status messages
const GENERATION_MESSAGES = [
  'Analyzing your tweet content...',
  'Crafting the perfect prompt...',
  'Generating your image...',
  'Adding artistic touches...',
  'Almost ready...'
];

export const useImageGeneration = (
  currentTweetId: string | null = null
): UseImageGenerationReturn => {
  // Core state
  const [state, setState] = useState<ImageState>({
    currentImage: null,
    uploadedImage: null,
    isGenerating: false,
    isUploading: false,
    isLoadingTweet: false,
    generationProgress: 0,
    generationMessage: '',
    estimatedTimeRemaining: 0,
    error: null,
  });

  // Refs for cleanup and race condition prevention
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationStartTimeRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentGenerationTweetIdRef = useRef<string | null>(null);
  const loadAbortControllerRef = useRef<AbortController | null>(null);

  // Cleanup intervals and abort requests on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadAbortControllerRef.current) {
        loadAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Progress simulation
  const startProgressSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      generationProgress: 0,
      generationMessage: GENERATION_MESSAGES[0] || 'Generating...',
      estimatedTimeRemaining: 20,
    }));
    
    generationStartTimeRef.current = Date.now();

    let progress = 0;
    let messageIndex = 0;
    let timeRemaining = 20;

    // Progress bar simulation
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 5; // Increment by 5-20%
      
      if (progress > 95) {
        progress = 95; // Don't complete until actual response
      }
      
      timeRemaining = Math.max(0, timeRemaining - (Math.random() * 2 + 1));
      
      setState(prev => ({
        ...prev,
        generationProgress: progress,
        estimatedTimeRemaining: Math.round(timeRemaining),
      }));
    }, 1000);

    // Message rotation
    messageIntervalRef.current = setInterval(() => {
      messageIndex = (messageIndex + 1) % GENERATION_MESSAGES.length;
      const message = GENERATION_MESSAGES[messageIndex];
      if (message) {
        setState(prev => ({
          ...prev,
          generationMessage: message,
        }));
      }
    }, 3000);
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      generationProgress: 100,
      generationMessage: 'Image generated successfully!',
      estimatedTimeRemaining: 0,
    }));
  }, []);

  // File validation
  const validateImageFile = useCallback((file: File): ImageValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    if (!IMAGE_CONFIG.ALLOWED_FORMATS.includes(file.type as any)) {
      errors.push(`File type ${file.type} is not supported. Please use JPEG, PNG, or WebP.`);
    }

    // Check file size
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      errors.push(`File size ${formatFileSize(file.size)} exceeds the maximum allowed size of ${formatFileSize(IMAGE_CONFIG.MAX_FILE_SIZE)}.`);
    }

    // Warning for large files
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE * 0.8) {
      warnings.push('Large file size may result in slower upload times.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  // Generate image
  const generateImage = useCallback(async (request: ImageGenerationRequest) => {
    if (!request.tweetContent.trim()) {
      const error: ImageError = {
        type: 'validation',
        message: 'Please write some tweet content first',
        retryable: false,
      };
      setState(prev => ({ ...prev, error: error.message }));
      toast.error(error.message);
      return;
    }

    if (request.tweetContent.length < 10) {
      const error: ImageError = {
        type: 'validation',
        message: 'Tweet content is too short for image generation',
        retryable: false,
      };
      setState(prev => ({ ...prev, error: error.message }));
      toast.error(error.message);
      return;
    }

    // Cancel any ongoing generation request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Track which tweet this generation is for
    const targetTweetId = request.tweetId || currentTweetId;
    currentGenerationTweetIdRef.current = targetTweetId;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    startProgressSimulation();

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetContent: request.tweetContent,
          tweetId: targetTweetId,
          style: request.style,
          size: request.size || '1024x1024',
          quality: request.quality || 'medium',
        }),
        signal: abortController.signal,
      });

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();
      
      // Double-check abort status before updating state
      if (abortController.signal.aborted) {
        return;
      }

      // Verify this response is for the current tweet (prevent race conditions)
      const currentTweet = currentTweetId;
      if (targetTweetId !== currentTweet && currentTweet !== null) {
        console.warn('Image generation completed for different tweet, ignoring result', {
          generatedFor: targetTweetId,
          currentTweet: currentTweet
        });
        return;
      }
      
      if (data.success && data.image) {
        stopProgressSimulation();
        
        const generatedImage: GeneratedImage = {
          id: data.image.id,
          base64Data: data.image.base64Data,
          prompt: data.image.prompt,
          style: data.image.style,
          generationTimeMs: data.image.generationTimeMs,
          fileSizeBytes: data.image.fileSizeBytes,
          savedToDatabase: data.image.savedToDatabase,
        };

        setState(prev => ({
          ...prev,
          currentImage: generatedImage,
          uploadedImage: null, // Clear uploaded image when AI generates one
          error: null,
        }));
        
        const actualTime = generationStartTimeRef.current 
          ? Date.now() - generationStartTimeRef.current 
          : data.image.generationTimeMs;
        
        toast.success(
          `Image generated in ${Math.round(actualTime / 1000)}s (${data.metadata.fileSize})`
        );
      } else {
        throw new Error('Invalid response from image generation API');
      }
    } catch (error) {
      // Ignore AbortError - it's expected when cancelling requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      stopProgressSimulation();
      const imageError: ImageError = {
        type: 'generation',
        message: error instanceof Error ? error.message : 'Failed to generate image',
        details: error,
        retryable: true,
      };
      
      setState(prev => ({
        ...prev,
        error: imageError.message,
        generationMessage: 'Generation failed',
      }));
      
      console.error('Image generation error:', error);
      toast.error(imageError.message);
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setState(prev => ({ ...prev, isGenerating: false }));
        
        // Reset progress states after a short delay
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            generationProgress: 0,
            generationMessage: '',
            estimatedTimeRemaining: 0,
          }));
          generationStartTimeRef.current = null;
        }, 2000);
      }
    }
  }, [currentTweetId, startProgressSimulation, stopProgressSimulation]);

  // Upload image
  const uploadImage = useCallback(async (file: File) => {
    const validation = validateImageFile(file);
    
    if (!validation.isValid) {
      const error: ImageError = {
        type: 'validation',
        message: validation.errors.join(', '),
        retryable: false,
      };
      setState(prev => ({ ...prev, error: error.message }));
      toast.error(error.message);
      return;
    }

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });

    setState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
    }));

    try {
      const base64Data = await convertFileToBase64(file);
      
      const uploadedImage: UploadedImage = {
        base64Data,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date(),
      };

      setState(prev => ({
        ...prev,
        uploadedImage,
        currentImage: null, // Clear AI generated image when user uploads one
        error: null,
      }));
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      const imageError: ImageError = {
        type: 'upload',
        message: 'Failed to upload image',
        details: error,
        retryable: true,
      };
      
      setState(prev => ({ ...prev, error: imageError.message }));
      console.error('Image upload error:', error);
      toast.error(imageError.message);
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  }, [validateImageFile]);

  // Remove image (UI only - doesn't delete from database)
  const removeImage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentImage: null,
      uploadedImage: null,
      error: null,
    }));
    
    toast.success('Image removed');
  }, []);

  // Delete image from database
  const deleteImage = useCallback(async (tweetId?: string) => {
    const targetTweetId = tweetId || currentTweetId;
    
    if (!targetTweetId) {
      const error: ImageError = {
        type: 'validation',
        message: 'Tweet ID is required to delete image',
        retryable: false,
      };
      setState(prev => ({ ...prev, error: error.message }));
      toast.error(error.message);
      return false;
    }

    try {
      const response = await fetch(`/api/images/${targetTweetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear the image from state
        setState(prev => ({
          ...prev,
          currentImage: null,
          uploadedImage: null,
          error: null,
        }));
        
        toast.success('Image deleted successfully');
        return true;
      } else if (response.status === 404) {
        // No image found - this is fine, just clear state
        setState(prev => ({
          ...prev,
          currentImage: null,
          uploadedImage: null,
          error: null,
        }));
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete image');
      }
    } catch (error) {
      const imageError: ImageError = {
        type: 'deletion',
        message: error instanceof Error ? error.message : 'Failed to delete image',
        details: error,
        retryable: true,
      };
      
      setState(prev => ({ ...prev, error: imageError.message }));
      console.error('Image deletion error:', error);
      toast.error(imageError.message);
      return false;
    }
  }, [currentTweetId]);

  // Load image for tweet with simplified error handling
  const loadImageForTweet = useCallback(async (tweetId: string) => {
    // Cancel any existing load request
    if (loadAbortControllerRef.current) {
      loadAbortControllerRef.current.abort();
    }

    // Create new AbortController for this load request
    const loadAbortController = new AbortController();
    loadAbortControllerRef.current = loadAbortController;
    
    setState(prev => ({
      ...prev,
      isLoadingTweet: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/images/${tweetId}`, {
        signal: loadAbortController.signal,
      });
      
      // Check if request was aborted
      if (loadAbortController.signal.aborted) {
        return;
      }

      // Verify we're still on the same tweet
      if (currentTweetId !== tweetId) {
        console.log(`Load completed for different tweet, ignoring result. Loaded: ${tweetId}, Current: ${currentTweetId}`);
        return;
      }
      
      if (response.ok) {
        const imageData = await response.json();
        
        // Final check before setting state
        if (!loadAbortController.signal.aborted && currentTweetId === tweetId) {
          if (imageData.image) {
            const generatedImage: GeneratedImage = {
              id: imageData.image.id,
              base64Data: imageData.image.base64_data,
              prompt: imageData.image.prompt,
              style: imageData.image.style,
              generationTimeMs: imageData.image.generation_time_ms,
              fileSizeBytes: imageData.image.file_size_bytes,
              savedToDatabase: true,
            };
            
            setState(prev => ({
              ...prev,
              currentImage: generatedImage,
              uploadedImage: null,
              isLoadingTweet: false,
            }));
          } else {
            // No image found - clear state
            setState(prev => ({
              ...prev,
              currentImage: null,
              uploadedImage: null,
              isLoadingTweet: false,
            }));
          }
        }
      } else if (response.status === 404) {
        // No image found for this tweet - this is normal
        if (currentTweetId === tweetId && !loadAbortController.signal.aborted) {
          setState(prev => ({
            ...prev,
            currentImage: null,
            uploadedImage: null,
            isLoadingTweet: false,
          }));
        }
      } else {
        // Other error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      // Ignore AbortError - it's expected when cancelling requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      console.error('Error loading image for tweet:', error);
      
      // Only update state if still on same tweet and not aborted
      if (currentTweetId === tweetId && !loadAbortController.signal.aborted) {
        setState(prev => ({
          ...prev,
          currentImage: null,
          uploadedImage: null,
          isLoadingTweet: false,
          error: 'Failed to load image',
        }));
      }
    }
  }, [currentTweetId]);

  // Clear image state
  const clearImageState = useCallback(() => {
    // Cancel any ongoing generation request when clearing state
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Cancel any ongoing load request
    if (loadAbortControllerRef.current) {
      loadAbortControllerRef.current.abort();
    }
    
    // Clear the current generation tweet tracking
    currentGenerationTweetIdRef.current = null;
    
    setState({
      currentImage: null,
      uploadedImage: null,
      isGenerating: false,
      isUploading: false,
      isLoadingTweet: false,
      generationProgress: 0,
      generationMessage: '',
      estimatedTimeRemaining: 0,
      error: null,
    });
  }, []);

  // Event listener for content loading events to trigger image loading
  useEffect(() => {
    const handleContentLoading = (event: CustomEvent) => {
      const { tweetId } = event.detail;
      
      // Cancel any ongoing generation request when switching tweets
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cancel any ongoing load request when switching tweets
      if (loadAbortControllerRef.current) {
        loadAbortControllerRef.current.abort();
      }
      
      if (tweetId) {
        // Update current generation tracking
        currentGenerationTweetIdRef.current = tweetId;
        // Load existing image for the tweet
        loadImageForTweet(tweetId);
      } else {
        // Clear image state when starting a new tweet (no tweetId)
        currentGenerationTweetIdRef.current = null;
        clearImageState();
      }
    };

    // Add event listener
    window.addEventListener('contentLoading', handleContentLoading as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('contentLoading', handleContentLoading as EventListener);
    };
  }, [loadImageForTweet, clearImageState]);

  // Utility functions
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatGenerationTime = useCallback((ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${Math.round(ms / 1000)}s`;
  }, []);

  const getImagePreviewUrl = useCallback((): string | null => {
    return state.currentImage?.base64Data || state.uploadedImage?.base64Data || null;
  }, [state.currentImage, state.uploadedImage]);

  const getImageForTwitter = useCallback((): string | null => {
    // Return the image data in the format needed for Twitter upload
    return getImagePreviewUrl();
  }, [getImagePreviewUrl]);

  // Computed properties
  const hasImage = Boolean(state.currentImage || state.uploadedImage);
  const displayImage = getImagePreviewUrl();
  const canGenerate = !state.isGenerating && !state.isUploading && !state.isLoadingTweet;
  const canUpload = !state.isGenerating && !state.isUploading && !state.isLoadingTweet;

  const imageMetadata: ImageMetadata | null = (() => {
    if (state.currentImage) {
      return {
        id: state.currentImage.id,
        type: 'generated',
        style: state.currentImage.style,
        generationTime: state.currentImage.generationTimeMs,
        fileSize: state.currentImage.fileSizeBytes,
        format: 'png', // AI generated images are typically PNG
        createdAt: new Date(), // Would be from database in real implementation
        prompt: state.currentImage.prompt,
      };
    }
    
    if (state.uploadedImage) {
      return {
        type: 'uploaded',
        fileSize: state.uploadedImage.fileSize,
        format: state.uploadedImage.fileType,
        createdAt: state.uploadedImage.uploadedAt,
      };
    }
    
    return null;
  })();

  // Memoize actions to prevent recreation on every render
  const actions = useMemo(() => ({
    generateImage,
    uploadImage,
    removeImage,
    deleteImage,
    loadImageForTweet,
    clearImageState,
  }), [
    generateImage,
    uploadImage,
    removeImage,
    deleteImage,
    loadImageForTweet,
    clearImageState,
  ]);

  return {
    // State
    state,
    
    // Actions
    actions,
    
    // Computed properties
    hasImage,
    displayImage,
    imageMetadata,
    canGenerate,
    canUpload,
    
    // Validation
    validateImageFile,
    
    // Utilities
    getImagePreviewUrl,
    getImageForTwitter,
    formatFileSize,
    formatGenerationTime,
  };
};

// Helper function to convert file to base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}; 