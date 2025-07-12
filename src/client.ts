/**
 * PostCrawl API client.
 */

import { z } from "zod";
import {
	API_VERSION,
	DEFAULT_BASE_URL,
	DEFAULT_MAX_RETRIES,
	DEFAULT_RETRY_DELAY,
	DEFAULT_TIMEOUT,
	EXTRACT_ENDPOINT,
	RATE_LIMIT_HEADER,
	RATE_LIMIT_REMAINING_HEADER,
	RATE_LIMIT_RESET_HEADER,
	SEARCH_AND_EXTRACT_ENDPOINT,
	SEARCH_ENDPOINT,
	USER_AGENT,
} from "./constants";
import {
	APIError,
	AuthenticationError,
	InsufficientCreditsError,
	NetworkError,
	RateLimitError,
	TimeoutError,
	ValidationError,
} from "./exceptions";
import {
	type ErrorDetail,
	type ErrorResponse,
	type ExtractRequest,
	ExtractRequestSchema,
	type ExtractResponse,
	type ExtractedPost,
	type PostCrawlClientOptions,
	type RateLimitInfo,
	type SearchAndExtractRequest,
	SearchAndExtractRequestSchema,
	type SearchAndExtractResponse,
	type SearchRequest,
	SearchRequestSchema,
	type SearchResponse,
	type SearchResult,
} from "./types";

/**
 * PostCrawl API client for searching and extracting content from social media.
 *
 * @example
 * ```typescript
 * const client = new PostCrawlClient({ apiKey: 'sk_...' })
 *
 * // Search for content
 * const results = await client.search({
 *   socialPlatforms: ['reddit'],
 *   query: 'machine learning',
 *   results: 10,
 *   page: 1
 * })
 *
 * // Extract content from URLs
 * const posts = await client.extract({
 *   urls: ['https://reddit.com/...'],
 *   includeComments: true
 * })
 * ```
 */
export class PostCrawlClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly timeout: number;
	private readonly maxRetries: number;
	private readonly retryDelay: number;

	public rateLimitInfo: RateLimitInfo = {
		limit: null,
		remaining: null,
		reset: null,
	};

	constructor(options: PostCrawlClientOptions) {
		if (!options.apiKey) {
			throw new Error("API key is required");
		}

		if (!options.apiKey.startsWith("sk_")) {
			throw new Error("API key must start with 'sk_'");
		}

		this.apiKey = options.apiKey;
		this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
		this.timeout = options.timeout || DEFAULT_TIMEOUT;
		this.maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
		this.retryDelay = options.retryDelay || DEFAULT_RETRY_DELAY;
	}

	private updateRateLimitInfo(headers: Headers): void {
		const limit = headers.get(RATE_LIMIT_HEADER);
		const remaining = headers.get(RATE_LIMIT_REMAINING_HEADER);
		const reset = headers.get(RATE_LIMIT_RESET_HEADER);

		if (limit) this.rateLimitInfo.limit = Number.parseInt(limit, 10);
		if (remaining)
			this.rateLimitInfo.remaining = Number.parseInt(remaining, 10);
		if (reset) this.rateLimitInfo.reset = Number.parseInt(reset, 10);
	}

	private async handleErrorResponse(response: Response): Promise<never> {
		let errorResponse: ErrorResponse;

		try {
			const errorData = await response.json();
			errorResponse = errorData as ErrorResponse;
		} catch {
			// If we can't parse the error, use the raw response
			errorResponse = {
				error: "Unknown error",
				message: (await response.text()) || `HTTP ${response.status}`,
			};
		}

		const requestId = errorResponse.requestId;

		switch (response.status) {
			case 401:
				throw new AuthenticationError(
					errorResponse.message,
					requestId,
					response,
				);
			case 403:
				throw new InsufficientCreditsError(
					errorResponse.message,
					undefined,
					undefined,
					requestId,
					response,
				);
			case 422:
				throw new ValidationError(
					errorResponse.message,
					errorResponse.details || [],
					requestId,
					response,
				);
			case 429: {
				const retryAfter = response.headers.get("Retry-After");
				throw new RateLimitError(
					errorResponse.message,
					retryAfter ? Number.parseInt(retryAfter, 10) : undefined,
					requestId,
					response,
				);
			}
			default:
				throw new APIError(
					errorResponse.message,
					response.status,
					requestId,
					response,
				);
		}
	}

	private async makeRequest<T>(
		method: string,
		endpoint: string,
		body?: unknown,
		retryCount = 0,
	): Promise<T> {
		const url = `${this.baseUrl}/${API_VERSION}${endpoint}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"User-Agent": USER_AGENT,
					"Content-Type": "application/json",
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			// Update rate limit info
			this.updateRateLimitInfo(response.headers);

			// Check for errors
			if (!response.ok) {
				await this.handleErrorResponse(response);
			}

			return (await response.json()) as T;
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error && error.name === "AbortError") {
				throw new TimeoutError("Request timed out", error);
			}

			if (
				error instanceof APIError ||
				error instanceof NetworkError ||
				error instanceof TimeoutError
			) {
				throw error;
			}

			// Network error - retry if we haven't exceeded max retries
			if (retryCount < this.maxRetries) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.retryDelay * (retryCount + 1)),
				);
				return this.makeRequest<T>(method, endpoint, body, retryCount + 1);
			}

			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new NetworkError(
				`Network error: ${errorMessage}`,
				error instanceof Error ? error : new Error(errorMessage),
			);
		}
	}

	/**
	 * Search for content across social media platforms.
	 *
	 * @param params - Search parameters
	 * @returns List of search results
	 * @throws {ValidationError} If request parameters are invalid
	 * @throws {AuthenticationError} If API key is invalid
	 * @throws {InsufficientCreditsError} If account has insufficient credits
	 * @throws {RateLimitError} If rate limit is exceeded
	 * @throws {APIError} For other API errors
	 */
	async search(params: SearchRequest): Promise<SearchResponse> {
		// Validate request
		let validatedParams: SearchRequest;
		try {
			validatedParams = SearchRequestSchema.parse(params);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const details: ErrorDetail[] = error.errors.map((err) => ({
					field: err.path.join("."),
					code: "invalid_value",
					message: err.message,
				}));
				throw new ValidationError("Invalid request parameters", details);
			}
			throw error;
		}

		// Convert to API format (snake_case)
		const apiRequest = {
			social_platforms: validatedParams.socialPlatforms,
			query: validatedParams.query,
			results: validatedParams.results,
			page: validatedParams.page,
		};

		// Make request
		const response = await this.makeRequest<SearchResult[]>(
			"POST",
			SEARCH_ENDPOINT,
			apiRequest,
		);

		return response;
	}

	/**
	 * Extract content from social media URLs.
	 *
	 * @param params - Extract parameters
	 * @returns List of extracted posts
	 * @throws {ValidationError} If request parameters are invalid
	 * @throws {AuthenticationError} If API key is invalid
	 * @throws {InsufficientCreditsError} If account has insufficient credits
	 * @throws {RateLimitError} If rate limit is exceeded
	 * @throws {APIError} For other API errors
	 */
	async extract(params: ExtractRequest): Promise<ExtractResponse> {
		// Validate request
		let validatedParams: ExtractRequest;
		try {
			validatedParams = ExtractRequestSchema.parse(params);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const details: ErrorDetail[] = error.errors.map((err) => ({
					field: err.path.join("."),
					code: "invalid_value",
					message: err.message,
				}));
				throw new ValidationError("Invalid request parameters", details);
			}
			throw error;
		}

		// Convert to API format (snake_case)
		const apiRequest = {
			urls: validatedParams.urls,
			include_comments: validatedParams.includeComments,
			response_mode: validatedParams.responseMode,
		};

		// Make request
		const response = await this.makeRequest<ExtractedPost[]>(
			"POST",
			EXTRACT_ENDPOINT,
			apiRequest,
		);

		return response;
	}

	/**
	 * Search for content and extract it in a single operation.
	 *
	 * @param params - Search and extract parameters
	 * @returns List of extracted posts from search results
	 * @throws {ValidationError} If request parameters are invalid
	 * @throws {AuthenticationError} If API key is invalid
	 * @throws {InsufficientCreditsError} If account has insufficient credits
	 * @throws {RateLimitError} If rate limit is exceeded
	 * @throws {APIError} For other API errors
	 */
	async searchAndExtract(
		params: SearchAndExtractRequest,
	): Promise<SearchAndExtractResponse> {
		// Validate request
		let validatedParams: SearchAndExtractRequest;
		try {
			validatedParams = SearchAndExtractRequestSchema.parse(params);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const details: ErrorDetail[] = error.errors.map((err) => ({
					field: err.path.join("."),
					code: "invalid_value",
					message: err.message,
				}));
				throw new ValidationError("Invalid request parameters", details);
			}
			throw error;
		}

		// Convert to API format (snake_case)
		const apiRequest = {
			social_platforms: validatedParams.socialPlatforms,
			query: validatedParams.query,
			results: validatedParams.results,
			page: validatedParams.page,
			include_comments: validatedParams.includeComments,
			response_mode: validatedParams.responseMode,
		};

		// Make request
		const response = await this.makeRequest<ExtractedPost[]>(
			"POST",
			SEARCH_AND_EXTRACT_ENDPOINT,
			apiRequest,
		);

		return response;
	}

	// Synchronous convenience methods

	/**
	 * Synchronous version of search().
	 */
	searchSync(params: SearchRequest): Promise<SearchResponse> {
		return this.search(params);
	}

	/**
	 * Synchronous version of extract().
	 */
	extractSync(params: ExtractRequest): Promise<ExtractResponse> {
		return this.extract(params);
	}

	/**
	 * Synchronous version of searchAndExtract().
	 */
	searchAndExtractSync(
		params: SearchAndExtractRequest,
	): Promise<SearchAndExtractResponse> {
		return this.searchAndExtract(params);
	}
}
