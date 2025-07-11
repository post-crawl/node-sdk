/**
 * PostCrawl API type definitions with Zod validation.
 */

import { z } from "zod";
import type {
	RedditComment as GeneratedRedditComment,
	RedditPost as GeneratedRedditPost,
	TiktokComment as GeneratedTiktokComment,
	TiktokPost as GeneratedTiktokPost,
} from "./generated-types";

// Re-export generated types
export type {
	RedditComment,
	RedditPost,
	TiktokComment,
	TiktokPost,
} from "./generated-types";

// Enums
export const SocialPlatformSchema = z.enum(["reddit", "tiktok"]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const ResponseModeSchema = z.enum(["raw", "markdown"]);
export type ResponseMode = z.infer<typeof ResponseModeSchema>;

// Request Schemas
export const SearchRequestSchema = z.object({
	socialPlatforms: z
		.array(SocialPlatformSchema)
		.min(1, "At least one social platform is required"),
	query: z.string().min(1, "Query cannot be empty").trim(),
	results: z.number().int().min(1).max(100),
	page: z.number().int().min(1),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const ExtractRequestSchema = z.object({
	urls: z
		.array(z.string().url())
		.min(1, "At least one URL is required")
		.max(100, "Cannot process more than 100 URLs at once"),
	includeComments: z.boolean().optional().default(false),
	responseMode: ResponseModeSchema.optional().default("raw"),
});

export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const SearchAndExtractRequestSchema = z.object({
	socialPlatforms: z
		.array(SocialPlatformSchema)
		.min(1, "At least one social platform is required"),
	query: z.string().min(1, "Query cannot be empty").trim(),
	results: z.number().int().min(1).max(100),
	page: z.number().int().min(1),
	includeComments: z.boolean().optional().default(false),
	responseMode: ResponseModeSchema.optional().default("raw"),
});

export type SearchAndExtractRequest = z.infer<
	typeof SearchAndExtractRequestSchema
>;

// Response Models
export interface SearchResult {
	title: string;
	url: string;
	snippet: string;
	date: string;
	imageUrl: string;
}

export interface ExtractedPost {
	url: string;
	source: "reddit" | "tiktok";
	raw: GeneratedRedditPost | GeneratedTiktokPost | null;
	markdown: string | null;
	error: string | null;
	// Additional fields for backward compatibility
	title?: string | null;
	author?: string | null;
	content?: string | null;
	comments?: Array<GeneratedRedditComment | GeneratedTiktokComment> | null;
}

// Response type aliases
export type ExtractResponse = ExtractedPost[];
export type SearchResponse = SearchResult[];
export type SearchAndExtractResponse = ExtractedPost[];

// Error Models
export interface ErrorDetail {
	field: string;
	code: string;
	message: string;
}

export interface ErrorResponse {
	error: string;
	message: string;
	requestId?: string;
	details?: ErrorDetail[];
}

// Rate limit info
export interface RateLimitInfo {
	limit: number | null;
	remaining: number | null;
	reset: number | null;
}

// Type guards
export function isRedditPost(raw: unknown): raw is GeneratedRedditPost {
	return !!(
		raw &&
		typeof raw === "object" &&
		raw !== null &&
		"subredditName" in raw
	);
}

export function isTiktokPost(raw: unknown): raw is GeneratedTiktokPost {
	return !!(
		raw &&
		typeof raw === "object" &&
		raw !== null &&
		"username" in raw &&
		"id" in raw
	);
}

// Client options
export interface PostCrawlClientOptions {
	apiKey: string;
	baseUrl?: string;
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
}
