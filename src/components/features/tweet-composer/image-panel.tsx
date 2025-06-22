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
    Upload,
    Wand2,
    X
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

// Style options for AI generation
const STYLE_OPTIONS = [
  {
    value: 'ghibli' as ImageStyle,
    name: 'Studio Ghibli',
    description: 'Whimsical, hand-drawn animation style',
    icon: <Sparkles className="w-4 h-4" />,
    preview: '🌸'
  },
  {
    value: 'photo_realistic' as ImageStyle,
    name: 'Photo Realistic',
    description: 'High-quality photorealistic images',
    icon: <Palette className="w-4 h-4" />,
    preview: '📸'
  }
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
}

export const ImagePanel = ({
  tweetContent,
  currentTweetId,
  onImageGenerated,
  onImageRemoved,
  currentImage,
  disabled = false
}: ImagePanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('ghibli');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the current image to display (generated or uploaded)
  const displayImage = currentImage?.base64Data || uploadedImage;
  const isAIGenerated = !!currentImage;

  const handleGenerateImage = useCallback(async () => {
    if (!tweetContent.trim()) {
      toast.error('Please write some tweet content first');
      return;
    }

    if (tweetContent.length < 10) {
      toast.error('Tweet content is too short for image generation');
      return;
    }

    setIsGenerating(true);

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
        
        toast.success(
          `Image generated in ${data.metadata.generationTime} (${data.metadata.fileSize})`
        );
      } else {
        throw new Error('Invalid response from image generation API');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate image. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [tweetContent, currentTweetId, selectedStyle, onImageGenerated]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setUploadedImage(base64Data);
      
      // Clear any AI generated image when user uploads one
      onImageRemoved?.();
      
      toast.success('Image uploaded successfully');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, [onImageRemoved]);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    onImageRemoved?.();
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast.success('Image removed');
  }, [onImageRemoved]);

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
        {displayImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={disabled}
            className="h-8 w-8 p-0"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Image Display Area - Fixed height */}
      <div className="mb-3 flex-shrink-0" style={{ height: '160px' }}>
        {displayImage ? (
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
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      {STYLE_OPTIONS.find(s => s.value === currentImage.style)?.name}
                    </Badge>
                    {currentImage.savedToDatabase && (
                      <Badge variant="secondary" className="bg-green-500/20 text-white text-xs">
                        Saved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{currentImage.generationTimeMs}ms</span>
                  </div>
                </div>
                <p className="text-xs mt-1 line-clamp-2 opacity-90">
                  {currentImage.prompt}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center p-4">
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-1">No image selected</p>
            <p className="text-xs text-gray-400">Generate AI image or upload your own</p>
          </div>
        )}
      </div>

      {/* AI Generation Section - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">AI Generation</span>
          </div>

          {/* Style Selector */}
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                disabled={disabled || isGenerating}
                className={cn(
                  'p-2 rounded-lg border text-left transition-colors',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedStyle === style.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200'
                )}
                aria-label={`Select ${style.name} style`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {style.icon}
                  <span className="text-xs font-medium">{style.name}</span>
                  <span className="text-sm">{style.preview}</span>
                </div>
                <p className="text-xs text-gray-500">{style.description}</p>
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateImage}
            disabled={disabled || isGenerating || !tweetContent.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            aria-label="Generate AI image from tweet content"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate AI Image
              </>
            )}
          </Button>

          {/* Upload Section */}
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2 mb-2">
              <Upload className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Upload Image</span>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled}
              aria-label="Upload image file"
            />
            
            <Button
              variant="outline"
              onClick={handleUploadClick}
              disabled={disabled}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• AI images are generated from your tweet content</p>
            <p>• Upload images must be under 5MB</p>
            <p>• Images are automatically saved with drafts</p>
          </div>
        </div>
      </div>
    </Card>
  );
}; 