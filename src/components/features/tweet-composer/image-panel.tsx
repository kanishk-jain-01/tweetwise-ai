'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import type { ImageStyle } from '@/lib/database/schema';
import { cn } from '@/lib/utils/cn';
import {
  Clock,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Style options for AI generation
const STYLE_OPTIONS = [
  {
    value: 'ghibli' as ImageStyle,
    name: 'Studio Ghibli',
    description: 'Whimsical, hand-drawn animation style',
    icon: <Sparkles className="w-4 h-4" />,
    preview: '🌸',
  },
  {
    value: 'photo_realistic' as ImageStyle,
    name: 'Photo Realistic',
    description: 'High-quality photorealistic images',
    icon: <Palette className="w-4 h-4" />,
    preview: '📸',
  },
] as const;

interface GeneratedImage {
  id?: string;
  base64Data: string;
  prompt: string;
  style: ImageStyle;
  generationTimeMs: number;
  fileSizeBytes: number;
  savedToDatabase: boolean;
}

interface ImagePanelProps {
  tweetContent: string;
  currentTweetId: string | null;
  onImageGenerated?: (image: GeneratedImage) => void;
  onImageRemoved?: () => void;
  currentImage?: GeneratedImage | null;
  disabled?: boolean;
  // Add hook actions
  imageActions?: {
    generateImage: (request: any) => Promise<void>;
    uploadImage: (file: File) => Promise<void>;
    removeImage: () => void;
    deleteImage: (tweetId?: string) => Promise<boolean>;
  };
  // Add hook state
  imageState?: {
    isGenerating: boolean;
    isUploading: boolean;
    isLoadingTweet: boolean;
    generationProgress: number;
    generationMessage: string;
    estimatedTimeRemaining: number;
    error: string | null;
  };
}

// Generation status messages
const GENERATION_MESSAGES = [
  'Analyzing your tweet content...',
  'Crafting the perfect prompt...',
  'Generating your image...',
  'Adding artistic touches...',
  'Almost ready...',
];

export const ImagePanel = ({
  tweetContent,
  currentTweetId,
  onImageGenerated,
  onImageRemoved,
  currentImage,
  disabled = false,
  imageActions,
  imageState,
}: ImagePanelProps) => {
  // Use hook state if provided, otherwise fallback to local state
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('ghibli');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Enhanced loading states - use hook state if available
  const [localGenerationProgress, setLocalGenerationProgress] = useState(0);
  const [localGenerationMessage, setLocalGenerationMessage] = useState('');
  const [localEstimatedTimeRemaining, setLocalEstimatedTimeRemaining] =
    useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );

  // Use hook state or fallback to local state
  const isGenerating = imageState?.isGenerating ?? localIsGenerating;
  const isLoadingTweet = imageState?.isLoadingTweet ?? false;
  const generationProgress =
    imageState?.generationProgress ?? localGenerationProgress;
  const generationMessage =
    imageState?.generationMessage ?? localGenerationMessage;
  const estimatedTimeRemaining =
    imageState?.estimatedTimeRemaining ?? localEstimatedTimeRemaining;

  // Removal state (removed replace functionality)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get the current image to display (generated or uploaded)
  const getDisplayImage = () => {
    if (currentImage?.base64Data) {
      // AI generated image - ensure proper data URL format
      const base64Data = currentImage.base64Data;
      if (base64Data.startsWith('data:')) {
        return base64Data; // Already formatted
      } else {
        return `data:image/png;base64,${base64Data}`; // Add data URL prefix
      }
    }
    return uploadedImage; // Already formatted for uploaded images
  };

  const displayImage = getDisplayImage();
  const isAIGenerated = !!currentImage;

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

  // Progress simulation function
  const startProgressSimulation = useCallback(() => {
    setLocalGenerationProgress(0);
    setLocalGenerationMessage(GENERATION_MESSAGES[0] || 'Generating...');
    setLocalEstimatedTimeRemaining(20); // Start with 20 seconds estimate
    setGenerationStartTime(Date.now());

    let progress = 0;
    let messageIndex = 0;
    let timeRemaining = 20;

    // Progress bar simulation
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 5; // Increment by 5-20%

      if (progress > 95) {
        progress = 95; // Don't complete until actual response
      }

      setLocalGenerationProgress(progress);

      // Update time remaining (decrease by 1-2 seconds)
      timeRemaining = Math.max(0, timeRemaining - (Math.random() * 2 + 1));
      setLocalEstimatedTimeRemaining(Math.round(timeRemaining));
    }, 1000);

    // Message rotation
    messageIntervalRef.current = setInterval(() => {
      messageIndex = (messageIndex + 1) % GENERATION_MESSAGES.length;
      const message = GENERATION_MESSAGES[messageIndex];
      if (message) {
        setLocalGenerationMessage(message);
      }
    }, 3000);
  }, []);

  // Stop progress simulation
  const stopProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }

    // Complete the progress bar
    setLocalGenerationProgress(100);
    setLocalGenerationMessage('Image generated successfully!');
    setLocalEstimatedTimeRemaining(0);
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!tweetContent.trim()) {
      toast.error('Please write some tweet content first');
      return;
    }

    if (tweetContent.length < 10) {
      toast.error('Tweet content is too short for image generation');
      return;
    }

    // Use hook action if available, otherwise fallback to direct API call
    if (imageActions?.generateImage) {
      try {
        await imageActions.generateImage({
          tweetContent,
          tweetId: currentTweetId,
          style: selectedStyle,
          size: '1024x1024',
          quality: 'medium',
        });
      } catch (error) {
        console.error('Image generation error:', error);
      }
      return;
    }

    // Fallback to direct API call (legacy behavior)
    setLocalIsGenerating(true);
    startProgressSimulation();

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetContent,
          tweetId: currentTweetId,
          style: selectedStyle,
          size: '1024x1024',
          quality: 'medium',
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

        onImageGenerated?.(generatedImage);

        // Clear any uploaded image when AI generates one
        setUploadedImage(null);

        const actualTime = generationStartTime
          ? Date.now() - generationStartTime
          : data.image.generationTimeMs;

        toast.success(
          `Image generated in ${Math.round(actualTime / 1000)}s (${data.metadata.fileSize})`
        );
      } else {
        throw new Error('Invalid response from image generation API');
      }
    } catch (error) {
      stopProgressSimulation();
      setLocalGenerationMessage('Generation failed');
      console.error('Image generation error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to generate image. Please try again.'
      );
    } finally {
      setLocalIsGenerating(false);

      // Reset progress states after a short delay
      setTimeout(() => {
        setLocalGenerationProgress(0);
        setLocalGenerationMessage('');
        setLocalEstimatedTimeRemaining(0);
        setGenerationStartTime(null);
      }, 2000);
    }
  }, [
    tweetContent,
    currentTweetId,
    selectedStyle,
    onImageGenerated,
    startProgressSimulation,
    stopProgressSimulation,
    generationStartTime,
  ]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file must be smaller than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const base64Data = e.target?.result as string;
        setUploadedImage(base64Data);

        // Clear any AI generated image when user uploads one (replaces automatically)
        onImageRemoved?.();

        toast.success('Image uploaded successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    },
    [onImageRemoved]
  );

  const handleRemoveImage = useCallback(() => {
    if (displayImage) {
      setShowRemoveConfirm(true);
    }
  }, [displayImage]);

  const confirmRemoveImage = useCallback(async () => {
    setShowRemoveConfirm(false);

    // If it's an AI-generated image with a tweet ID, delete from database
    if (isAIGenerated && currentTweetId && imageActions?.deleteImage) {
      try {
        const success = await imageActions.deleteImage(currentTweetId);
        if (success) {
          // The deleteImage action handles state clearing and toast notification
          return;
        }
      } catch (error) {
        console.error('Failed to delete image from database:', error);
        // Fall back to local removal
      }
    }

    // For uploaded images or fallback, just clear local state
    setUploadedImage(null);
    onImageRemoved?.();

    // Reset file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast.success('Image removed');
  }, [isAIGenerated, currentTweetId, imageActions, onImageRemoved]);

  const cancelRemoveImage = useCallback(() => {
    setShowRemoveConfirm(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className="p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Image</h3>
        </div>
        {displayImage && !showRemoveConfirm && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              disabled={disabled || isGenerating || isLoadingTweet}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="Remove image"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        {isLoadingTweet && (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-xs text-muted-foreground">
              Loading image...
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Removal */}
      {showRemoveConfirm && (
        <div className="mb-3 flex-shrink-0">
          <div className="p-3 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center space-x-2 mb-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Remove Image?
              </span>
            </div>
            <p className="text-xs text-red-700 mb-3">
              This will permanently remove the{' '}
              {isAIGenerated ? 'AI generated' : 'uploaded'} image from your
              tweet.
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelRemoveImage}
                className="text-xs h-7"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmRemoveImage}
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Display Area - Compact height */}
      <div className="mb-3 flex-shrink-0" style={{ height: '120px' }}>
        {isLoadingTweet ? (
          // Loading state for tweet switching
          <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center p-4">
            <LoadingSpinner size="md" />
            <p className="text-sm text-muted-foreground mt-2">
              Loading image...
            </p>
          </div>
        ) : displayImage ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50">
            <img
              src={displayImage}
              alt={isAIGenerated ? currentImage?.prompt : 'Uploaded image'}
              className="w-full h-full object-cover"
            />

            {/* Image Metadata Overlay */}
            {isAIGenerated && currentImage && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white text-xs"
                    >
                      {
                        STYLE_OPTIONS.find(s => s.value === currentImage.style)
                          ?.name
                      }
                    </Badge>
                    {currentImage.savedToDatabase && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-white text-xs"
                      >
                        Saved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.round(currentImage.generationTimeMs / 1000)}s
                    </span>
                  </div>
                </div>
                <p className="text-xs mt-1 line-clamp-2 opacity-90">
                  {currentImage.prompt}
                </p>
              </div>
            )}

            {/* Upload indicator for uploaded images */}
            {!isAIGenerated && uploadedImage && (
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-500/80 text-white text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Uploaded
                </Badge>
              </div>
            )}
          </div>
        ) : isGenerating ? (
          // Enhanced loading state for image generation
          <div className="w-full h-full rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 opacity-50 animate-pulse" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Animated loading icon */}
              <div className="relative mb-3">
                <Wand2 className="w-8 h-8 text-purple-500 animate-bounce" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
                </div>
              </div>

              {/* Generation message */}
              <p className="text-sm font-medium text-purple-700 mb-2">
                {generationMessage}
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-32 mb-2">
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>

              {/* Time remaining */}
              {estimatedTimeRemaining > 0 && (
                <div className="flex items-center space-x-1 text-xs text-purple-600">
                  <Clock className="w-3 h-3" />
                  <span>~{estimatedTimeRemaining}s remaining</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center p-4">
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-1">No image selected</p>
            <p className="text-xs text-gray-400">
              Generate AI image or upload your own
            </p>
          </div>
        )}
      </div>

      {/* Generation Progress Bar (when generating) */}
      {isGenerating && (
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-purple-600 mb-1">
            <span className="font-medium">Generating Image</span>
            <span>{Math.round(generationProgress)}%</span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-purple-500 mt-1">
            <span>{generationMessage}</span>
            {estimatedTimeRemaining > 0 && (
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>~{estimatedTimeRemaining}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Generation Section - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">AI Generation</span>
          </div>

          {/* Style Selector - Horizontal Layout */}
          <div className="flex gap-2">
            {STYLE_OPTIONS.map(style => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                disabled={disabled || isGenerating}
                className={cn(
                  'flex-1 p-2 rounded-lg border text-center transition-colors',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedStyle === style.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200',
                  isGenerating &&
                    selectedStyle === style.value &&
                    'animate-pulse'
                )}
                aria-label={`Select ${style.name} style`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center space-x-1">
                    {style.icon}
                    <span className="text-sm">{style.preview}</span>
                  </div>
                  <span className="text-xs font-medium">{style.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Generate Button - Compact */}
          <Button
            onClick={handleGenerateImage}
            disabled={disabled || isGenerating || !tweetContent.trim()}
            size="sm"
            className={cn(
              'w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200',
              isGenerating && 'bg-purple-500 cursor-not-allowed'
            )}
            aria-label="Generate AI image from tweet content"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="w-3 h-3 mr-1" />
                <span className="animate-pulse text-xs">Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                <span className="text-xs">Generate AI Image</span>
              </>
            )}
          </Button>

          {/* Upload Section - Compact */}
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2 mb-1">
              <Upload className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-medium">Upload Image</span>
            </div>

            {/* Main upload input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled || isGenerating}
              aria-label="Upload image file"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={disabled || isGenerating}
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Upload className="w-3 h-3 mr-1" />
              <span className="text-xs">Upload Image</span>
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• AI images are generated from your tweet content</p>
            <p>• Upload images must be under 5MB</p>
            <p>• Images are automatically saved with drafts</p>
            {isGenerating && (
              <p className="text-purple-600 font-medium">
                • Generation typically takes 15-30 seconds
              </p>
            )}
            {displayImage && (
              <p className="text-green-600 font-medium">
                • Generate or upload again to replace current image
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
