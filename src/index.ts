/**
 * PostCrawl Node.js SDK - A TypeScript client for the PostCrawl API.
 * 
 * This SDK provides a simple and type-safe way to interact with the PostCrawl API
 * for searching and extracting content from social media platforms.
 */

export const __version__ = '1.0.0'

export { PostCrawlClient } from './client'
export type { PostCrawlClientOptions } from './client'

export {
  APIError,
  AuthenticationError,
  InsufficientCreditsError,
  NetworkError,
  PostCrawlError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from './exceptions'

export {
  ExtractedPost,
  ExtractRequest,
  ExtractResponse,
  RedditComment,
  RedditPost,
  ResponseMode,
  SearchAndExtractRequest,
  SearchAndExtractResponse,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SocialPlatform,
  SocialPost,
  TiktokComment,
  TiktokPost,
  createExtractedPost,
} from './types'

export type {
  ErrorDetail,
  ErrorResponse,
} from './types'

// Re-export all named exports
export * from './client'
export * from './exceptions'
export * from './types'