import { sql } from './index';
import type { AIResponse } from './schema';

// Interface for analysis with metadata
export interface AnalysisWithMetadata extends AIResponse {
  created_at: Date;
}

/**
 * Database query class for AI response operations with versioning support
 * Handles storage and retrieval of tweet analysis data with full version history
 */
export class AIResponseQueries {
  /**
   * Save or update analysis for a tweet
   * Creates new analysis if none exists, updates existing one if it does
   * 
   * @param tweetId - The UUID of the tweet being analyzed
   * @param type - Type of analysis ('spelling' | 'grammar' | 'critique' | 'curation')
   * @param responseData - The analysis result data from AI service
   * @returns Promise<AIResponse> - The saved/updated analysis
   */
  static async saveAnalysis(
    tweetId: string,
    type: 'spelling' | 'grammar' | 'critique' | 'curation',
    responseData: Record<string, any>
  ): Promise<AIResponse> {
    try {
      // Generate a unique request hash for this analysis
      const requestHash = `${type}:${tweetId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

      // First, try to update existing analysis
      const updateResult = await sql`
        UPDATE ai_responses 
        SET response_data = ${JSON.stringify(responseData)}, 
            request_hash = ${requestHash},
            created_at = NOW()
        WHERE tweet_id = ${tweetId} AND type = ${type}
        RETURNING id, tweet_id, type, request_hash, response_data, created_at
      `;

      if (updateResult.length > 0) {
        return updateResult[0] as AIResponse;
      }

      // If no existing analysis, create new one
      const insertResult = await sql`
        INSERT INTO ai_responses (tweet_id, type, request_hash, response_data, created_at)
        VALUES (${tweetId}, ${type}, ${requestHash}, ${JSON.stringify(responseData)}, NOW())
        RETURNING id, tweet_id, type, request_hash, response_data, created_at
      `;

      if (insertResult.length === 0) {
        throw new Error('Failed to save analysis - no result returned');
      }

      return insertResult[0] as AIResponse;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw new Error(`Failed to save ${type} analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get analysis for a tweet
   * 
   * @param tweetId - The UUID of the tweet
   * @param type - Type of analysis to retrieve
   * @returns Promise<AIResponse | null> - Analysis or null if none exists
   */
  static async getAnalysis(
    tweetId: string,
    type: 'spelling' | 'grammar' | 'critique' | 'curation'
  ): Promise<AIResponse | null> {
    try {
      const results = await sql`
        SELECT id, tweet_id, type, request_hash, response_data, created_at
        FROM ai_responses 
        WHERE tweet_id = ${tweetId} AND type = ${type}
        LIMIT 1
      `;

      if (results.length === 0) {
        return null;
      }

      return results[0] as AIResponse;
    } catch (error) {
      console.error('Error retrieving analysis:', error);
      throw new Error(`Failed to retrieve ${type} analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific analysis by its ID
   * 
   * @param analysisId - The UUID of the analysis
   * @returns Promise<AIResponse | null> - The analysis or null if not found
   */
  static async getAnalysisById(analysisId: string): Promise<AIResponse | null> {
    try {
      const results = await sql`
        SELECT id, tweet_id, type, request_hash, response_data, created_at
        FROM ai_responses 
        WHERE id = ${analysisId}
        LIMIT 1
      `;

      if (results.length === 0) {
        return null;
      }

      return results[0] as AIResponse;
    } catch (error) {
      console.error('Error retrieving analysis by ID:', error);
      throw new Error(`Failed to retrieve analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all analysis data for a tweet (cleanup when tweet is deleted)
   * 
   * @param tweetId - The UUID of the tweet
   * @returns Promise<number> - Number of analysis records deleted
   */
  static async deleteAnalysisForTweet(tweetId: string): Promise<number> {
    try {
      const result = await sql`
        DELETE FROM ai_responses 
        WHERE tweet_id = ${tweetId}
        RETURNING id
      `;

      return result.length;
    } catch (error) {
      console.error('Error deleting analysis for tweet:', error);
      throw new Error(`Failed to delete analysis for tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all analysis types available for a tweet
   * 
   * @param tweetId - The UUID of the tweet
   * @returns Promise<string[]> - Array of analysis types that exist for this tweet
   */
  static async getAvailableAnalysisTypes(tweetId: string): Promise<string[]> {
    try {
      const results = await sql`
        SELECT DISTINCT type
        FROM ai_responses 
        WHERE tweet_id = ${tweetId}
        ORDER BY type
      `;

      return results.map(row => row.type);
    } catch (error) {
      console.error('Error getting available analysis types:', error);
      return [];
    }
  }
} 