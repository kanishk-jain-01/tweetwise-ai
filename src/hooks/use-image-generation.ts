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
    generationProgress: 0,
    generationMessage: '',
    estimatedTimeRemaining: 0,
    error: null,
  });

  // Refs for cleanup
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationStartTimeRef = useRef<number | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
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
          tweetId: request.tweetId || currentTweetId,
          style: request.style,
          size: request.size || '1024x1024',
          quality: request.quality || 'medium',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();
      
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

  // Remove image
  const removeImage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentImage: null,
      uploadedImage: null,
      error: null,
    }));
    
    toast.success('Image removed');
  }, []);

  // Replace image
  const replaceImage = useCallback(async (type: 'upload' | 'generate', data?: any) => {
    if (type === 'upload' && data instanceof File) {
      await uploadImage(data);
    } else if (type === 'generate' && data) {
      await generateImage(data);
    }
  }, [uploadImage, generateImage]);

  // Load image for tweet
  const loadImageForTweet = useCallback(async (tweetId: string) => {
    try {
      const response = await fetch(`/api/images/${tweetId}`);
      
      if (response.ok) {
        const imageData = await response.json();
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
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load image for tweet:', error);
      // Don't show error toast for loading failures as they're not critical
    }
  }, []);

  // Save image with tweet
  const saveImageWithTweet = useCallback(async (tweetId: string) => {
    setState(prevState => {
      const { currentImage, uploadedImage } = prevState;
      
      if (!currentImage && !uploadedImage) {
        return prevState; // No image to save
      }

      // Perform the async operation without depending on state
      (async () => {
        try {
          // For AI generated images, update the tweet_id in the database
          if (currentImage?.id) {
            await fetch(`/api/images/${currentImage.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tweet_id: tweetId,
              }),
            });
          }
          
          // For uploaded images, we might need to save them to the database
          // This would be implemented based on the specific requirements
          
        } catch (error) {
          console.error('Failed to save image with tweet:', error);
          // Don't throw error as this shouldn't block tweet saving
        }
      })();

      return prevState; // Return unchanged state
    });
  }, []); // No dependencies

  // Clear image state
  const clearImageState = useCallback(() => {
    setState({
      currentImage: null,
      uploadedImage: null,
      isGenerating: false,
      isUploading: false,
      generationProgress: 0,
      generationMessage: '',
      estimatedTimeRemaining: 0,
      error: null,
    });
  }, []);

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
  const canGenerate = !state.isGenerating && !state.isUploading;
  const canUpload = !state.isGenerating && !state.isUploading;

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
    replaceImage,
    loadImageForTweet,
    saveImageWithTweet,
    clearImageState,
  }), [
    generateImage,
    uploadImage,
    removeImage,
    replaceImage,
    loadImageForTweet,
    saveImageWithTweet,
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