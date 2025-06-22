import { sql } from './index';
import type { CreateImageData, Image, ImageStyle, UpdateImageData } from './schema';

/**
 * Database query class for image operations
 * Handles storage, retrieval, and management of AI-generated tweet images
 */
export class ImageQueries {
  /**
   * Save a new image to the database
   * 
   * @param imageData - The image data to save
   * @returns Promise<Image> - The saved image with generated ID
   */
  static async saveImage(imageData: CreateImageData): Promise<Image> {
    try {
      const result = await sql`
        INSERT INTO images (
          tweet_id, 
          base64_data, 
          prompt, 
          style, 
          size, 
          format, 
          quality, 
          generation_time_ms, 
          file_size_bytes,
          created_at
        )
        VALUES (
          ${imageData.tweet_id},
          ${imageData.base64_data},
          ${imageData.prompt},
          ${imageData.style},
          ${imageData.size},
          ${imageData.format},
          ${imageData.quality},
          ${imageData.generation_time_ms || null},
          ${imageData.file_size_bytes || null},
          NOW()
        )
        RETURNING id, tweet_id, base64_data, prompt, style, size, format, quality, generation_time_ms, file_size_bytes, created_at
      `;

      if (result.length === 0) {
        throw new Error('Failed to save image - no result returned');
      }

      return result[0] as Image;
    } catch (error) {
      console.error('Error saving image:', error);
      throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get image by tweet ID
   * 
   * @param tweetId - The UUID of the tweet
   * @returns Promise<Image | null> - The image or null if none exists
   */
  static async getImageByTweetId(tweetId: string): Promise<Image | null> {
    try {
      const results = await sql`
        SELECT id, tweet_id, base64_data, prompt, style, size, format, quality, generation_time_ms, file_size_bytes, created_at
        FROM images 
        WHERE tweet_id = ${tweetId}
        LIMIT 1
      `;

      if (results.length === 0) {
        return null;
      }

      return results[0] as Image;
    } catch (error) {
      console.error('Error retrieving image by tweet ID:', error);
      throw new Error(`Failed to retrieve image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get image by ID
   * 
   * @param imageId - The UUID of the image
   * @returns Promise<Image | null> - The image or null if not found
   */
  static async getImageById(imageId: string): Promise<Image | null> {
    try {
      const results = await sql`
        SELECT id, tweet_id, base64_data, prompt, style, size, format, quality, generation_time_ms, file_size_bytes, created_at
        FROM images 
        WHERE id = ${imageId}
        LIMIT 1
      `;

      if (results.length === 0) {
        return null;
      }

      return results[0] as Image;
    } catch (error) {
      console.error('Error retrieving image by ID:', error);
      throw new Error(`Failed to retrieve image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing image
   * 
   * @param imageId - The UUID of the image to update
   * @param updateData - The data to update
   * @returns Promise<Image | null> - The updated image or null if not found
   */
  static async updateImage(imageId: string, updateData: UpdateImageData): Promise<Image | null> {
    try {
      // Get current image first
      const currentImage = await this.getImageById(imageId);
      if (!currentImage) {
        return null;
      }

      // Merge current data with updates
      const updatedData = {
        tweet_id: updateData.tweet_id !== undefined ? updateData.tweet_id : currentImage.tweet_id,
        base64_data: updateData.base64_data ?? currentImage.base64_data,
        prompt: updateData.prompt ?? currentImage.prompt,
        style: updateData.style ?? currentImage.style,
        size: updateData.size ?? currentImage.size,
        format: updateData.format ?? currentImage.format,
        quality: updateData.quality ?? currentImage.quality,
        generation_time_ms: updateData.generation_time_ms ?? currentImage.generation_time_ms,
        file_size_bytes: updateData.file_size_bytes ?? currentImage.file_size_bytes,
      };

      const result = await sql`
        UPDATE images 
        SET tweet_id = ${updatedData.tweet_id},
            base64_data = ${updatedData.base64_data},
            prompt = ${updatedData.prompt},
            style = ${updatedData.style},
            size = ${updatedData.size},
            format = ${updatedData.format},
            quality = ${updatedData.quality},
            generation_time_ms = ${updatedData.generation_time_ms},
            file_size_bytes = ${updatedData.file_size_bytes}
        WHERE id = ${imageId}
        RETURNING id, tweet_id, base64_data, prompt, style, size, format, quality, generation_time_ms, file_size_bytes, created_at
      `;

      if (result.length === 0) {
        return null;
      }

      return result[0] as Image;
    } catch (error) {
      console.error('Error updating image:', error);
      throw new Error(`Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete image by ID
   * 
   * @param imageId - The UUID of the image to delete
   * @returns Promise<boolean> - True if deleted, false if not found
   */
  static async deleteImage(imageId: string): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM images 
        WHERE id = ${imageId}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete image by tweet ID (cleanup when tweet is deleted)
   * 
   * @param tweetId - The UUID of the tweet
   * @returns Promise<boolean> - True if deleted, false if not found
   */
  static async deleteImageByTweetId(tweetId: string): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM images 
        WHERE tweet_id = ${tweetId}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting image by tweet ID:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save or update image for a tweet (upsert operation)
   * Creates new image if none exists, updates existing one if it does
   * 
   * @param imageData - The image data to save or update
   * @returns Promise<Image> - The saved/updated image
   */
  static async saveOrUpdateImage(imageData: CreateImageData): Promise<Image> {
    try {
      // First, try to update existing image
      const updateResult = await sql`
        UPDATE images 
        SET base64_data = ${imageData.base64_data},
            prompt = ${imageData.prompt},
            style = ${imageData.style},
            size = ${imageData.size},
            format = ${imageData.format},
            quality = ${imageData.quality},
            generation_time_ms = ${imageData.generation_time_ms || null},
            file_size_bytes = ${imageData.file_size_bytes || null},
            created_at = NOW()
        WHERE tweet_id = ${imageData.tweet_id}
        RETURNING id, tweet_id, base64_data, prompt, style, size, format, quality, generation_time_ms, file_size_bytes, created_at
      `;

      if (updateResult.length > 0) {
        return updateResult[0] as Image;
      }

      // If no existing image, create new one
      return await this.saveImage(imageData);
    } catch (error) {
      console.error('Error saving or updating image:', error);
      throw new Error(`Failed to save or update image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get images by style
   * 
   * @param style - The image style to filter by
   * @param limit - Maximum number of images to return (default: 10)
   * @returns Promise<Image[]> - Array of images with the specified style
   */
  static async getImagesByStyle(style: ImageStyle, limit: number = 10): Promise<Image[]> {
    try {
      const results = await sql`
        SELECT id, tweet_id, base64_data, prompt, style, size, format, quality, generation_time_ms, file_size_bytes, created_at
        FROM images 
        WHERE style = ${style}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return results as Image[];
    } catch (error) {
      console.error('Error retrieving images by style:', error);
      throw new Error(`Failed to retrieve images by style: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recent images
   * 
   * @param limit - Maximum number of images to return (default: 10)
   * @returns Promise<Image[]> - Array of recent images
   */
  static async getRecentImages(limit: number = 10): Promise<Image[]> {
    try {
      const results = await sql`
        SELECT id, tweet_id, base64_data, prompt, style, size, format, quality, generation_time_ms, file_size_bytes, created_at
        FROM images 
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return results as Image[];
    } catch (error) {
      console.error('Error retrieving recent images:', error);
      throw new Error(`Failed to retrieve recent images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get image count by style
   * 
   * @returns Promise<Record<ImageStyle, number>> - Count of images by style
   */
  static async getImageCountByStyle(): Promise<Record<string, number>> {
    try {
      const results = await sql`
        SELECT style, COUNT(*) as count
        FROM images 
        GROUP BY style
        ORDER BY style
      `;

      const counts: Record<string, number> = {};
      for (const row of results) {
        counts[row.style] = parseInt(row.count as string);
      }

      return counts;
    } catch (error) {
      console.error('Error getting image count by style:', error);
      return {};
    }
  }
} 