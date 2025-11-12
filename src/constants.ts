/**
 * PostCrawl API constants.
 */

// API endpoints
export const DEFAULT_BASE_URL = "https://edge.postcrawl.com";
export const API_VERSION = "v1";

// Endpoints
export const SEARCH_ENDPOINT = "/search";
export const EXTRACT_ENDPOINT = "/extract";
export const SEARCH_AND_EXTRACT_ENDPOINT = "/search-and-extract";

// Request defaults
export const DEFAULT_TIMEOUT = 0; // No timeout
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY = 1000; // 1 second in milliseconds

// Headers
export const USER_AGENT = "postcrawl-node/1.0.0";

// Rate limiting
export const RATE_LIMIT_HEADER = "X-RateLimit-Limit";
export const RATE_LIMIT_REMAINING_HEADER = "X-RateLimit-Remaining";
export const RATE_LIMIT_RESET_HEADER = "X-RateLimit-Reset";
