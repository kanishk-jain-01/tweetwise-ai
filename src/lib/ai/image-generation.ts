import type { ImageGenerationRequest, ImageStyle } from '@/lib/database/schema';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Style prompt templates for different visual styles
const STYLE_TEMPLATES = {
  ghibli: {
    name: 'Studio Ghibli Style',
    promptSuffix: ', in the style of Studio Ghibli animation, soft watercolor aesthetic, whimsical and dreamy, hand-drawn animation style, vibrant natural colors, magical realism',
    description: 'Whimsical, hand-drawn animation style with soft colors and magical elements'
  },
  photo_realistic: {
    name: 'Photo Realistic',
    promptSuffix: ', photorealistic, high quality photography, professional lighting, sharp details, realistic textures, cinematic composition',
    description: 'High-quality photorealistic images with professional photography aesthetics'
  }
} as const;

// Image generation parameters
const IMAGE_CONFIG = {
  model: 'dall-e-3', // Using DALL-E 3 as it's the current image generation model
  size: '1024x1024' as const,
  quality: 'standard' as const,
  response_format: 'b64_json' as const,
} as const;

/**
 * Generate an image prompt from tweet content
 * Analyzes the tweet text and creates a descriptive visual prompt
 */
export function generateImagePromptFromTweet(tweetContent: string, style: ImageStyle): string {
  // Clean and prepare the tweet content
  const cleanContent = tweetContent
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/@\w+/g, '') // Remove mentions
    .replace(/#\w+/g, '') // Remove hashtags (we'll add them back contextually)
    .trim();

  // Extract hashtags for context
  const hashtags = tweetContent.match(/#\w+/g) || [];
  const hashtagContext = hashtags.length > 0 ? ` (context: ${hashtags.join(' ')})` : '';

  // Base prompt from tweet content
  let basePrompt = cleanContent;

  // If the tweet is very short or abstract, enhance it
  if (cleanContent.length < 20) {
    basePrompt = `Visual representation of: ${cleanContent}`;
  }

  // Add contextual enhancement based on content
  if (cleanContent.toLowerCase().includes('code') || cleanContent.toLowerCase().includes('programming')) {
    basePrompt += ', programming and technology theme';
  } else if (cleanContent.toLowerCase().includes('nature') || cleanContent.toLowerCase().includes('environment')) {
    basePrompt += ', natural environment and landscapes';
  } else if (cleanContent.toLowerCase().includes('business') || cleanContent.toLowerCase().includes('entrepreneur')) {
    basePrompt += ', professional business setting';
  } else if (cleanContent.toLowerCase().includes('art') || cleanContent.toLowerCase().includes('creative')) {
    basePrompt += ', artistic and creative elements';
  }

  // Apply style template
  const styleTemplate = STYLE_TEMPLATES[style];
  const finalPrompt = basePrompt + hashtagContext + styleTemplate.promptSuffix;

  return finalPrompt;
}

/**
 * Generate image using OpenAI's DALL-E 3 model
 */
export async function generateImage(request: ImageGenerationRequest): Promise<{
  base64Data: string;
  prompt: string;
  generationTimeMs: number;
  fileSizeBytes: number;
}> {
  const startTime = Date.now();

  try {
    // Generate the enhanced prompt
    const enhancedPrompt = generateImagePromptFromTweet(request.prompt, request.style);

    console.log('Generating image with prompt:', enhancedPrompt);

    // Call OpenAI API
    const response = await openai.images.generate({
      model: IMAGE_CONFIG.model,
      prompt: enhancedPrompt,
      size: (request.size || IMAGE_CONFIG.size) as '1024x1024' | '1792x1024' | '1024x1792',
      quality: request.quality === 'high' ? 'hd' : IMAGE_CONFIG.quality,
      response_format: IMAGE_CONFIG.response_format,
      n: 1, // Generate only one image
    });

    const generationTimeMs = Date.now() - startTime;

    // Extract the base64 data
    if (!response.data || response.data.length === 0) {
      throw new Error('No image data received from OpenAI');
    }

    const imageData = response.data[0];
    if (!imageData || !imageData.b64_json) {
      throw new Error('No image data received from OpenAI');
    }

    const base64Data = imageData.b64_json;
    
    // Calculate approximate file size (base64 is ~1.37x larger than binary)
    const fileSizeBytes = Math.round((base64Data.length * 3) / 4);

    console.log(`Image generated successfully in ${generationTimeMs}ms, size: ${fileSizeBytes} bytes`);

    return {
      base64Data,
      prompt: enhancedPrompt,
      generationTimeMs,
      fileSizeBytes,
    };

  } catch (error) {
    const generationTimeMs = Date.now() - startTime;
    console.error('Error generating image:', error);
    
    // Provide specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        throw new Error('Image generation failed: Content violates OpenAI policy. Please try a different prompt.');
      } else if (error.message.includes('rate_limit_exceeded')) {
        throw new Error('Image generation failed: Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('insufficient_quota')) {
        throw new Error('Image generation failed: API quota exceeded. Please check your OpenAI account.');
      }
    }

    throw new Error(`Image generation failed after ${generationTimeMs}ms: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate image generation request
 */
export function validateImageRequest(request: ImageGenerationRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate prompt
  if (!request.prompt || request.prompt.trim().length === 0) {
    errors.push('Prompt is required');
  } else if (request.prompt.length > 1000) {
    errors.push('Prompt must be less than 1000 characters');
  }

  // Validate style
  if (!request.style || !Object.keys(STYLE_TEMPLATES).includes(request.style)) {
    errors.push('Valid style is required (ghibli or photo_realistic)');
  }

  // Validate size if provided
  if (request.size && !['1024x1024', '1792x1024', '1024x1792'].includes(request.size)) {
    errors.push('Size must be 1024x1024, 1792x1024, or 1024x1792');
  }

  // Validate quality if provided
  if (request.quality && !['high', 'medium', 'low'].includes(request.quality)) {
    errors.push('Quality must be high, medium, or low');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get available styles with descriptions
 */
export function getAvailableStyles(): Array<{
  value: ImageStyle;
  name: string;
  description: string;
}> {
  return Object.entries(STYLE_TEMPLATES).map(([key, template]) => ({
    value: key as ImageStyle,
    name: template.name,
    description: template.description,
  }));
}

/**
 * Convert base64 to binary buffer for Twitter upload
 */
export function base64ToBuffer(base64Data: string): Buffer {
  return Buffer.from(base64Data, 'base64');
}

/**
 * Get image format from base64 data header
 */
export function getImageFormatFromBase64(base64Data: string): 'png' | 'jpeg' | 'webp' {
  // DALL-E 3 typically returns PNG format
  // We can detect format from data URL header if present
  if (base64Data.startsWith('data:image/')) {
    if (base64Data.includes('image/jpeg')) return 'jpeg';
    if (base64Data.includes('image/webp')) return 'webp';
  }
  
  // Default to PNG for DALL-E 3
  return 'png';
} 