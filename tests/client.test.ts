/**
 * Tests for PostCrawl client functionality.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostCrawlClient } from "../src/client";
import {
	AuthenticationError,
	InsufficientCreditsError,
	NetworkError,
	RateLimitError,
	TimeoutError,
	ValidationError,
} from "../src/exceptions";
import {
	mockExtractResponse,
	mockRateLimitHeaders,
	mockSearchResponse,
} from "./fixtures";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PostCrawlClient", () => {
	const apiKey = "sk_test_123456789";
	let client: PostCrawlClient;

	beforeEach(() => {
		client = new PostCrawlClient({ apiKey });
		mockFetch.mockClear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("initialization", () => {
		it("should initialize with valid API key", () => {
			const client = new PostCrawlClient({ apiKey });
			expect(client).toBeDefined();
			expect(client.rateLimitInfo).toEqual({
				limit: null,
				remaining: null,
				reset: null,
			});
		});

		it("should throw error for missing API key", () => {
			expect(() => new PostCrawlClient({ apiKey: "" })).toThrow(
				"API key is required",
			);
		});

		it("should throw error for invalid API key format", () => {
			expect(() => new PostCrawlClient({ apiKey: "invalid_key" })).toThrow(
				"API key must start with 'sk_'",
			);
		});

		it("should accept custom parameters", () => {
			const client = new PostCrawlClient({
				apiKey,
				baseUrl: "https://custom.api.com",
				timeout: 30000,
				maxRetries: 5,
				retryDelay: 2000,
			});
			expect(client).toBeDefined();
		});
	});

	describe("search", () => {
		it("should successfully search for content", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(mockRateLimitHeaders),
				json: async () => mockSearchResponse,
			});

			const results = await client.search({
				socialPlatforms: ["reddit"],
				query: "machine learning",
				results: 10,
				page: 1,
			});

			expect(results).toHaveLength(2);
			expect(results[0].title).toBe("Understanding Machine Learning Basics");
			expect(results[0].url).toContain("reddit.com");
			expect(client.rateLimitInfo.limit).toBe(200);
			expect(client.rateLimitInfo.remaining).toBe(150);
		});

		it("should handle empty search results", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => [],
			});

			const results = await client.search({
				socialPlatforms: ["reddit", "tiktok"],
				query: "very specific query",
				results: 10,
				page: 1,
			});

			expect(results).toEqual([]);
		});

		it("should validate request parameters", async () => {
			await expect(
				client.search({
					socialPlatforms: [],
					query: "test",
					results: 10,
					page: 1,
				}),
			).rejects.toThrow(ValidationError);
		});

		it("should handle authentication error", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				headers: new Headers(),
				json: async () => ({
					error: "unauthorized",
					message: "Invalid API key",
					requestId: "req_123",
				}),
			});

			await expect(
				client.search({
					socialPlatforms: ["reddit"],
					query: "test",
					results: 10,
					page: 1,
				}),
			).rejects.toThrow(AuthenticationError);
		});

		it("should handle rate limit error", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 429,
				headers: new Headers({ "Retry-After": "60" }),
				json: async () => ({
					error: "rate_limit_exceeded",
					message: "Too many requests",
					requestId: "req_456",
				}),
			});

			await expect(
				client.search({
					socialPlatforms: ["reddit"],
					query: "test",
					results: 10,
					page: 1,
				}),
			).rejects.toThrow(RateLimitError);
		});
	});

	describe("extract", () => {
		it("should successfully extract content", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => mockExtractResponse,
			});

			const results = await client.extract({
				urls: [
					"https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/",
					"https://www.tiktok.com/@pythontutor/video/7123456789012345678",
					"https://invalid.url/post",
				],
				includeComments: true,
				responseMode: "raw",
			});

			expect(results).toHaveLength(3);
			expect(results[0].source).toBe("reddit");
			expect(results[0].raw).toBeDefined();
			expect(results[0].error).toBeNull();
			expect(results[2].error).toBe("Failed to extract content: Invalid URL");
		});

		it("should validate URLs", async () => {
			await expect(
				client.extract({
					urls: ["not-a-valid-url"],
					includeComments: false,
				}),
			).rejects.toThrow(ValidationError);
		});

		it("should handle insufficient credits error", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 403,
				headers: new Headers(),
				json: async () => ({
					error: "insufficient_credits",
					message: "Not enough credits. Required: 10, Available: 5",
					requestId: "req_789",
				}),
			});

			await expect(
				client.extract({
					urls: ["https://www.reddit.com/r/Python/comments/1ab2c3d/test/"],
				}),
			).rejects.toThrow(InsufficientCreditsError);
		});
	});

	describe("searchAndExtract", () => {
		it("should successfully search and extract", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => mockExtractResponse.slice(0, 2),
			});

			const results = await client.searchAndExtract({
				socialPlatforms: ["reddit", "tiktok"],
				query: "python tutorial",
				results: 10,
				page: 1,
				includeComments: true,
				responseMode: "raw",
			});

			expect(results).toHaveLength(2);
			expect(results[0].source).toBe("reddit");
			expect(results[1].source).toBe("tiktok");
		});
	});

	describe("network and retry", () => {
		it("should retry on network error", async () => {
			// First request fails
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			// Second request succeeds
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => [],
			});

			const results = await client.search({
				socialPlatforms: ["reddit"],
				query: "test",
				results: 10,
				page: 1,
			});

			expect(results).toEqual([]);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("should throw after max retries", async () => {
			// All requests fail
			mockFetch.mockRejectedValue(new Error("Network error"));

			const client = new PostCrawlClient({
				apiKey,
				maxRetries: 2,
				retryDelay: 10,
			});

			await expect(
				client.search({
					socialPlatforms: ["reddit"],
					query: "test",
					results: 10,
					page: 1,
				}),
			).rejects.toThrow(NetworkError);

			// Initial request + 2 retries = 3 calls
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});

		it("should handle timeout error", async () => {
			// Mock abort error
			const abortError = new Error("Aborted");
			abortError.name = "AbortError";
			mockFetch.mockRejectedValueOnce(abortError);

			const client = new PostCrawlClient({ apiKey, timeout: 100 });

			await expect(
				client.search({
					socialPlatforms: ["reddit"],
					query: "test",
					results: 10,
					page: 1,
				}),
			).rejects.toThrow(TimeoutError);
		});
	});

	describe("synchronous methods", () => {
		it("should provide sync wrapper for search", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => mockSearchResponse,
			});

			const results = await client.searchSync({
				socialPlatforms: ["reddit"],
				query: "test",
				results: 10,
				page: 1,
			});

			expect(results).toHaveLength(2);
		});

		it("should provide sync wrapper for extract", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => mockExtractResponse,
			});

			const results = await client.extractSync({
				urls: ["https://reddit.com/test"],
			});

			expect(results).toHaveLength(3);
		});

		it("should provide sync wrapper for searchAndExtract", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers(),
				json: async () => mockExtractResponse.slice(0, 1),
			});

			const results = await client.searchAndExtractSync({
				socialPlatforms: ["reddit"],
				query: "test",
				results: 10,
				page: 1,
			});

			expect(results).toHaveLength(1);
		});
	});
});
