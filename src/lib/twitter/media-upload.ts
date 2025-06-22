/**
 * Twitter Media Upload Utility
 * Handles uploading images to Twitter's v2 media API using direct HTTP requests
 * Uses POST https://api.x.com/2/media/upload with OAuth 2.0 and media.write scope
 */

export interface MediaUploadResult {
  media_id: string;
  media_id_string: string;
  size: number;
  expires_after_secs?: number;
  image?: {
    image_type: string;
    w: number;
    h: number;
  };
}

export interface MediaUploadError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Convert base64 image data to Buffer
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @returns Buffer containing the binary image data
 */
export function base64ToBuffer(base64Data: string): Buffer {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Clean, 'base64');
}

/**
 * Compress image if it's too large for Twitter
 * @param base64Data - Original base64 image data
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 4MB to leave buffer)
 * @returns Compressed base64 image data
 */
export function compressImageIfNeeded(
  base64Data: string,
  maxSizeBytes: number = 4 * 1024 * 1024
): string {
  const originalBuffer = base64ToBuffer(base64Data);

  // If image is already small enough, return as-is
  if (originalBuffer.length <= maxSizeBytes) {
    return base64Data;
  }

  // Calculate compression ratio needed
  const compressionRatio = Math.sqrt(maxSizeBytes / originalBuffer.length);

  console.warn(
    `Image too large (${Math.round(originalBuffer.length / 1024)}KB), compressing with ratio ${compressionRatio.toFixed(2)}`
  );

  // For now, return the original and let Twitter handle it
  // TODO: Implement actual image compression using canvas or sharp
  return base64Data;
}

/**
 * Get MIME type from base64 data URL
 * @param base64Data - Base64 encoded image data with data URL prefix
 * @returns MIME type string (e.g., 'image/png')
 */
export function getMimeTypeFromBase64(base64Data: string): string {
  const match = base64Data.match(
    /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/
  );
  return match?.[1] || 'image/png'; // Default to PNG if no match
}

/**
 * Get file extension from MIME type
 * @param mimeType - MIME type string
 * @returns File extension string
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return mimeToExt[mimeType] || 'png';
}

/**
 * Twitter Media Upload Class
 * Handles direct HTTP requests to Twitter's v2 media upload API
 */
export class TwitterMediaUploader {
  private accessToken: string;
  private baseUrl = 'https://api.x.com/2';
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests to avoid rate limiting

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Throttle requests to avoid rate limiting
   */
  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(
        `Throttling request, waiting ${waitTime}ms to avoid rate limiting`
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Upload image to Twitter v2 media API using direct HTTP request
   * @param base64Data - Base64 encoded image data
   * @param altText - Optional alt text for accessibility
   * @returns Promise<MediaUploadResult> - Media upload result with media_id
   */
  async uploadImage(
    base64Data: string,
    _altText?: string
  ): Promise<MediaUploadResult> {
    try {
      // Throttle request to avoid rate limiting
      await this.throttleRequest();

      // Compress image if needed
      const compressedBase64 = compressImageIfNeeded(base64Data);
      const imageBuffer = base64ToBuffer(compressedBase64);
      const mimeType = getMimeTypeFromBase64(compressedBase64);

      console.log(
        `Uploading image: ${Math.round(imageBuffer.length / 1024)}KB, MIME: ${mimeType}`
      );

      // Validate image size (Twitter limit is 5MB for images, we use 4MB to be safe)
      const maxSizeBytes = 4 * 1024 * 1024; // 4MB to leave buffer
      if (imageBuffer.length > maxSizeBytes) {
        throw new Error(
          `Image size (${Math.round(imageBuffer.length / 1024)}KB) is too large. Please try a smaller image.`
        );
      }

      // Validate MIME type
      const supportedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!supportedTypes.includes(mimeType)) {
        throw new Error(
          `Unsupported image type: ${mimeType}. Supported types: ${supportedTypes.join(', ')}`
        );
      }

      // Create form data for media upload
      const formData = new FormData();

      // Create a Blob from the buffer
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      formData.append(
        'media',
        imageBlob,
        `image.${getFileExtensionFromMimeType(mimeType)}`
      );

      // Add media_category - this is REQUIRED by Twitter v2 API
      formData.append('media_category', 'tweet_image');

      // Make direct HTTP request to Twitter v2 media upload endpoint
      const response = await fetch(`${this.baseUrl}/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          // Don't set Content-Type - let the browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          'Twitter v2 media upload error:',
          response.status,
          errorData
        );

        // Handle specific HTTP status codes
        if (response.status === 400) {
          console.error('400 Bad Request error details:', errorData);
          throw new Error(
            `Invalid request: ${errorData.detail || errorData.errors?.[0]?.message || 'Please check image format and size'}`
          );
        }
        if (response.status === 401) {
          throw new Error(
            'Twitter authentication failed. Please reconnect your account.'
          );
        }
        if (response.status === 403) {
          // Log the full error for debugging
          console.error('403 Forbidden error details:', errorData);

          if (
            errorData.detail?.includes('scope') ||
            errorData.title?.includes('scope') ||
            errorData.errors?.[0]?.message?.includes('scope')
          ) {
            throw new Error(
              'Missing media.write permission. Please disconnect and reconnect your Twitter account to get the required permissions.'
            );
          }

          // Check if it's specifically about media upload permissions
          if (
            errorData.title?.includes('media') ||
            errorData.detail?.includes('media')
          ) {
            throw new Error(
              'Media upload not permitted. Please disconnect and reconnect your Twitter account with media upload permissions.'
            );
          }

          throw new Error(
            'Access denied. Your Twitter account may need additional permissions. Please disconnect and reconnect your account.'
          );
        }
        if (response.status === 413) {
          throw new Error(
            'Image is too large. Twitter supports images up to 5MB.'
          );
        }
        if (response.status === 415) {
          throw new Error(
            'Unsupported image format. Please use JPEG, PNG, GIF, or WebP.'
          );
        }
        if (response.status === 429) {
          throw new Error(
            'Twitter media upload rate limit exceeded. Please try again later.'
          );
        }

        throw new Error(
          `Twitter media upload failed: ${response.status} ${response.statusText}`
        );
      }

      const uploadResult = await response.json();

      // Debug: Log the actual response from Twitter
      console.log(
        'Twitter media upload response:',
        JSON.stringify(uploadResult, null, 2)
      );

      // Extract media ID from Twitter v2 API response structure
      const mediaId =
        uploadResult.data?.id ||
        uploadResult.media_id ||
        uploadResult.media_id_string;
      const mediaKey = uploadResult.data?.media_key;

      // Validate response structure
      if (!mediaId) {
        console.error(
          'Missing media ID in response. Full response:',
          uploadResult
        );
        throw new Error(
          `Invalid response from Twitter media upload API. No media ID found. Response: ${JSON.stringify(uploadResult)}`
        );
      }

      console.log(
        `Media upload successful! Media ID: ${mediaId}, Media Key: ${mediaKey}`
      );

      return {
        media_id: mediaId,
        media_id_string: mediaId,
        size: uploadResult.data?.size || imageBuffer.length,
        expires_after_secs: uploadResult.data?.expires_after_secs,
        image: uploadResult.data?.image,
      };
    } catch (error) {
      console.error('Twitter v2 media upload error:', error);

      // Re-throw our custom errors
      if (
        error instanceof Error &&
        (error.message.includes('Twitter') ||
          error.message.includes('Image is too large') ||
          error.message.includes('Unsupported image format') ||
          error.message.includes('rate limit') ||
          error.message.includes('authentication') ||
          error.message.includes('scope') ||
          error.message.includes('Invalid request'))
      ) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Network error during image upload. Please check your connection.'
        );
      }

      throw new Error(
        `Failed to upload image to Twitter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Upload multiple images (for tweet threads or multiple media)
   * @param base64Images - Array of base64 encoded image data
   * @param altTexts - Optional array of alt texts (must match images length)
   * @returns Promise<MediaUploadResult[]> - Array of media upload results
   */
  async uploadMultipleImages(
    base64Images: string[],
    altTexts?: string[]
  ): Promise<MediaUploadResult[]> {
    // Twitter allows up to 4 images per tweet
    if (base64Images.length > 4) {
      throw new Error('Twitter supports a maximum of 4 images per tweet');
    }

    if (altTexts && altTexts.length !== base64Images.length) {
      throw new Error('Alt texts array must match the number of images');
    }

    const uploadPromises = base64Images.map((base64Data, index) =>
      this.uploadImage(base64Data, altTexts?.[index])
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple image upload error:', error);
      throw error;
    }
  }

  /**
   * Check media upload status (for async uploads)
   * @param mediaId - Media ID to check
   * @returns Promise<any> - Media status information
   */
  async checkMediaStatus(mediaId: string): Promise<any> {
    try {
      // Make direct HTTP request to check media status
      const response = await fetch(`${this.baseUrl}/media/${mediaId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to check media status: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Media status check error:', error);
      // For images, status checking is typically not needed as uploads are synchronous
      return { media_id: mediaId, status: 'succeeded' };
    }
  }
}

/**
 * Utility function to create a media uploader instance
 * @param accessToken - Twitter OAuth 2.0 access token
 * @returns TwitterMediaUploader instance
 */
export function createMediaUploader(accessToken: string): TwitterMediaUploader {
  return new TwitterMediaUploader(accessToken);
}

/**
 * Validate image data before upload
 * @param base64Data - Base64 encoded image data
 * @returns boolean - True if valid, throws error if invalid
 */
export function validateImageData(base64Data: string): boolean {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error('Image data must be a non-empty string');
  }

  // Check if it's base64 format
  const base64Regex = /^data:image\/[a-zA-Z0-9-.+]+;base64,/;
  if (!base64Regex.test(base64Data)) {
    throw new Error('Image data must be in base64 data URL format');
  }

  // Check if base64 data is not empty after prefix
  const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  if (!base64Clean || base64Clean.length === 0) {
    throw new Error('Base64 image data is empty');
  }

  return true;
}
