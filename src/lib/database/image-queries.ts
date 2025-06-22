import { sql } from './index';
import type { CreateImageData, Image, ImageStyle } from './schema';

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
      throw new Error(
        `Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (results.length === 0) {
        return null;
      }

      return results[0] as Image;
    } catch (error) {
      console.error('Error retrieving image by tweet ID:', error);
      throw new Error(
        `Failed to retrieve image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      throw new Error(
        `Failed to retrieve image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      throw new Error(
        `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      throw new Error(
        `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save or replace image for a tweet (enforces one-to-one relationship)
   * Deletes any existing image for the tweet, then creates new one
   *
   * @param imageData - The image data to save
   * @returns Promise<Image> - The saved image
   */
  static async replaceImageForTweet(
    imageData: CreateImageData
  ): Promise<Image> {
    try {
      // First, delete any existing image for this tweet
      await sql`
        DELETE FROM images 
        WHERE tweet_id = ${imageData.tweet_id}
      `;

      // Then create the new image
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
      console.error('Error replacing image for tweet:', error);
      throw new Error(
        `Failed to replace image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get images by style
   *
   * @param style - The image style to filter by
   * @param limit - Maximum number of images to return (default: 10)
   * @returns Promise<Image[]> - Array of images with the specified style
   */
  static async getImagesByStyle(
    style: ImageStyle,
    limit: number = 10
  ): Promise<Image[]> {
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
      throw new Error(
        `Failed to retrieve images by style: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      throw new Error(
        `Failed to retrieve recent images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
