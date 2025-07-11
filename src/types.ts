/**
 * PostCrawl API type definitions - Compatibility layer.
 * 
 * This module provides backward compatibility by re-exporting generated types
 * and adding any custom validators or additional types not in the generated code.
 * 
 * Key Types:
 * - SearchResult: Response from search endpoint (title, url, snippet, date, image_url)
 * - ExtractedPost: Response from extract endpoint (url, source, raw, markdown, error)
 * - SocialPost: DEPRECATED - Legacy search response type (use SearchResult instead)
 */

import { z } from 'zod'

// Import all generated types
import {
  PostOutputT,
  RedditPost,
  SearchResult,
  TiktokPost,
} from './generated-types'

// Re-export enums with proper names
export type SocialPlatform = 'reddit' | 'tiktok'
export type ResponseMode = 'raw' | 'markdown'

// Zod schemas for validation
const socialPlatformSchema = z.enum(['reddit', 'tiktok'])
const responseModeSchema = z.enum(['raw', 'markdown'])

// Custom ExtractRequest with URL validation and field descriptions
export const extractRequestSchema = z.object({
  urls: z
    .array(z.string().url())
    .min(1, 'At least one URL is required')
    .max(100, 'Cannot process more than 100 URLs at once'),
  include_comments: z.boolean().optional().default(false),
  response_mode: responseModeSchema.optional().default('raw'),
})

export type ExtractRequest = z.infer<typeof extractRequestSchema>

// Custom SearchRequest with validations
export const searchRequestSchema = z.object({
  social_platforms: z
    .array(socialPlatformSchema)
    .min(1, 'At least one social platform is required'),
  query: z.string().min(1).transform((val) => val.trim()),
  results: z.number().int().positive().max(100),
  page: z.number().int().positive(),
})

export type SearchRequest = z.infer<typeof searchRequestSchema>

// Custom SearchAndExtractRequest with validations
export const searchAndExtractRequestSchema = z.object({
  social_platforms: z
    .array(socialPlatformSchema)
    .min(1, 'At least one social platform is required'),
  query: z.string().min(1).transform((val) => val.trim()),
  results: z.number().int().positive().max(100),
  page: z.number().int().positive(),
  include_comments: z.boolean().optional().default(false),
  response_mode: responseModeSchema.optional().default('raw'),
})

export type SearchAndExtractRequest = z.infer<typeof searchAndExtractRequestSchema>

// Response Models - Extend the generated PostOutputT type
export interface ExtractedPost extends PostOutputT {
  // Additional fields for backward compatibility
  title?: string
  author?: string
  content?: string
  comments?: any[]

  // Methods
  isRedditPost(): boolean
  isTiktokPost(): boolean
  getRedditPost(): RedditPost | null
  getTiktokPost(): TiktokPost | null
}

// Helper to create ExtractedPost with methods
export function createExtractedPost(data: PostOutputT & Partial<ExtractedPost>): ExtractedPost {
  return {
    ...data,
    get platform() {
      return this.source
    },
    isRedditPost() {
      return this.source === 'reddit' && this.raw !== null && this.raw !== undefined && 'subredditName' in this.raw
    },
    isTiktokPost() {
      return this.source === 'tiktok' && this.raw !== null && this.raw !== undefined && 'hashtags' in this.raw
    },
    getRedditPost() {
      if (this.isRedditPost()) {
        return this.raw as RedditPost
      }
      return null
    },
    getTiktokPost() {
      if (this.isTiktokPost()) {
        return this.raw as TiktokPost
      }
      return null
    },
  }
}

// SearchResult is imported from generated_types, which has:
// - title: string
// - url: string
// - snippet: string
// - date: string
// - imageUrl: string (aliased from API's imageUrl)

// Map API response to our interface
export function mapSearchResult(apiResult: any): SearchResult {
  return {
    title: apiResult.title,
    url: apiResult.url,
    snippet: apiResult.snippet,
    date: apiResult.date,
    imageUrl: apiResult.imageUrl || '',
  }
}

// Legacy model for backward compatibility (deprecated)
export interface SocialPost {
  /**
   * Legacy response model for search results.
   * 
   * DEPRECATED: Use SearchResult instead. This model is kept for backward compatibility
   * but does not match the actual API response.
   */
  id?: string
  title?: string
  author?: string
  upvotes?: number
  comments?: number
  created_at?: string
  url?: string
  social_source?: SocialPlatform
}

// Response type aliases
export type ExtractResponse = ExtractedPost[]
export type SearchResponse = SearchResult[]
export type SearchAndExtractResponse = ExtractedPost[]

// Type guard functions for type narrowing
export function isRedditPost(raw: any): raw is RedditPost {
  return raw !== null && raw !== undefined && typeof raw === 'object' && 'subredditName' in raw
}

export function isTiktokPost(raw: any): raw is TiktokPost {
  return raw !== null && raw !== undefined && typeof raw === 'object' && 'hashtags' in raw
}

// Error Models (these weren't generated, so we keep them)
export interface ErrorDetail {
  field: string
  code: string
  message: string
}

export interface ErrorResponse {
  error: string
  message: string
  request_id?: string
  details?: ErrorDetail[]
}

// Re-export platform-specific types for easy access
export type { RedditPost, TiktokPost, SearchResult }