/**
 * Tests for type definitions and validation
 */

import { describe, expect, it } from "vitest";
import {
	ExtractRequestSchema,
	SearchAndExtractRequestSchema,
	SearchRequestSchema,
	isRedditPost,
	isTiktokPost,
} from "../src/types";

describe("Type Validation", () => {
	describe("SearchRequestSchema", () => {
		it("should validate valid search request", () => {
			const valid = {
				socialPlatforms: ["reddit", "tiktok"],
				query: "machine learning",
				results: 10,
				page: 1,
			};

			expect(() => SearchRequestSchema.parse(valid)).not.toThrow();
		});

		it("should reject empty social platforms", () => {
			const invalid = {
				socialPlatforms: [],
				query: "test",
				results: 10,
				page: 1,
			};

			expect(() => SearchRequestSchema.parse(invalid)).toThrow();
		});

		it("should reject empty query", () => {
			const invalid = {
				socialPlatforms: ["reddit"],
				query: "",
				results: 10,
				page: 1,
			};

			expect(() => SearchRequestSchema.parse(invalid)).toThrow();
		});

		it("should reject invalid result count", () => {
			const invalid = {
				socialPlatforms: ["reddit"],
				query: "test",
				results: 0,
				page: 1,
			};

			expect(() => SearchRequestSchema.parse(invalid)).toThrow();
		});

		it("should reject results over 100", () => {
			const invalid = {
				socialPlatforms: ["reddit"],
				query: "test",
				results: 101,
				page: 1,
			};

			expect(() => SearchRequestSchema.parse(invalid)).toThrow();
		});
	});

	describe("ExtractRequestSchema", () => {
		it("should validate valid extract request", () => {
			const valid = {
				urls: ["https://reddit.com/r/test/comments/123/test/"],
				includeComments: true,
				responseMode: "markdown",
			};

			expect(() => ExtractRequestSchema.parse(valid)).not.toThrow();
		});

		it("should provide defaults", () => {
			const minimal = {
				urls: ["https://reddit.com/test"],
			};

			const parsed = ExtractRequestSchema.parse(minimal);
			expect(parsed.includeComments).toBe(false);
			expect(parsed.responseMode).toBe("raw");
		});

		it("should reject empty URLs", () => {
			const invalid = {
				urls: [],
			};

			expect(() => ExtractRequestSchema.parse(invalid)).toThrow();
		});

		it("should reject invalid URLs", () => {
			const invalid = {
				urls: ["not-a-url"],
			};

			expect(() => ExtractRequestSchema.parse(invalid)).toThrow();
		});

		it("should reject more than 100 URLs", () => {
			const invalid = {
				urls: Array(101).fill("https://example.com"),
			};

			expect(() => ExtractRequestSchema.parse(invalid)).toThrow();
		});
	});

	describe("SearchAndExtractRequestSchema", () => {
		it("should validate valid request", () => {
			const valid = {
				socialPlatforms: ["reddit"],
				query: "python tutorial",
				results: 5,
				page: 1,
				includeComments: true,
				responseMode: "markdown",
			};

			expect(() => SearchAndExtractRequestSchema.parse(valid)).not.toThrow();
		});

		it("should provide defaults for optional fields", () => {
			const minimal = {
				socialPlatforms: ["tiktok"],
				query: "test",
				results: 10,
				page: 1,
			};

			const parsed = SearchAndExtractRequestSchema.parse(minimal);
			expect(parsed.includeComments).toBe(false);
			expect(parsed.responseMode).toBe("raw");
		});
	});

	describe("Type Guards", () => {
		it("should identify Reddit posts", () => {
			const redditPost = {
				id: "123",
				subredditName: "test",
				title: "Test Post",
				author: "testuser",
				score: 42,
			};

			expect(isRedditPost(redditPost)).toBe(true);
			expect(isTiktokPost(redditPost)).toBe(false);
		});

		it("should identify TikTok posts", () => {
			const tiktokPost = {
				id: "7123456789",
				username: "testuser",
				description: "Test video",
				likes: "100",
			};

			expect(isTiktokPost(tiktokPost)).toBe(true);
			expect(isRedditPost(tiktokPost)).toBe(false);
		});

		it("should reject null/undefined", () => {
			expect(isRedditPost(null)).toBe(false);
			expect(isRedditPost(undefined)).toBe(false);
			expect(isTiktokPost(null)).toBe(false);
			expect(isTiktokPost(undefined)).toBe(false);
		});

		it("should reject non-objects", () => {
			expect(isRedditPost("string")).toBe(false);
			expect(isRedditPost(123)).toBe(false);
			expect(isTiktokPost("string")).toBe(false);
			expect(isTiktokPost(123)).toBe(false);
		});
	});
});
