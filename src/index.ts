/**
 * PostCrawl Node.js SDK - A TypeScript client for the PostCrawl API.
 *
 * This SDK provides a simple and type-safe way to interact with the PostCrawl API
 * for searching and extracting content from social media platforms.
 */

export { PostCrawlClient } from "./client";
// Export exceptions
export {
	APIError,
	AuthenticationError,
	InsufficientCreditsError,
	NetworkError,
	PostCrawlError,
	RateLimitError,
	TimeoutError,
	ValidationError,
} from "./exceptions";
// Export types
export type {
	// Response types
	ExtractedPost,
	// Request types
	ExtractRequest,
	ExtractResponse,
	// Client options
	PostCrawlClientOptions,
	// Rate limit info
	RateLimitInfo,
	RedditComment,
	// Platform-specific types
	RedditPost,
	ResponseMode,
	SearchAndExtractRequest,
	SearchAndExtractResponse,
	SearchRequest,
	SearchResponse,
	SearchResult,
	// Enums
	SocialPlatform,
	TiktokComment,
	TiktokPost,
} from "./types";

// Export type guards
export { isRedditPost, isTiktokPost } from "./types";

// Version
export const version = "0.1.0";
