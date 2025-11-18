import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostCrawlClient } from "../src/client";
import {
	EXTRACT_ENDPOINT,
	SEARCH_AND_EXTRACT_ENDPOINT,
} from "../src/constants";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Comment Filtering Support", () => {
	const client = new PostCrawlClient({ apiKey: "sk_test" });

	beforeEach(() => {
		mockFetch.mockReset();
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => [],
			headers: new Headers(),
		});
	});

	it("should pass comment_filter_config in extract request", async () => {
		const filterConfig = {
			min_score: 10,
			max_depth: 2,
		};

		await client.extract({
			urls: ["https://reddit.com/r/test"],
			includeComments: true,
			responseMode: "raw",
			commentFilterConfig: filterConfig,
		});

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining(EXTRACT_ENDPOINT),
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining(
					'"comment_filter_config":{"min_score":10,"max_depth":2}',
				),
			}),
		);
	});

	it("should pass comment_filter_config in searchAndExtract request", async () => {
		const filterConfig = {
			tier_limits: { "0": 5 },
			preserve_high_quality_threads: false,
		};

		await client.searchAndExtract({
			socialPlatforms: ["reddit"],
			query: "test",
			results: 10,
			page: 1,
			includeComments: true,
			responseMode: "raw",
			commentFilterConfig: filterConfig,
		});

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining(SEARCH_AND_EXTRACT_ENDPOINT),
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining(
					'"comment_filter_config":{"tier_limits":{"0":5},"preserve_high_quality_threads":false}',
				),
			}),
		);
	});
});
