#!/usr/bin/env tsx
/**
 * Simple search example - PostCrawl SDK 101
 */

import { config } from "dotenv";
import { PostCrawlClient } from "../src";

// Load environment variables from .env file
config();

const API_KEY = process.env.POSTCRAWL_API_KEY || "sk_your_api_key_here";

if (!API_KEY || API_KEY === "sk_your_api_key_here") {
	console.error("❌ Error: POSTCRAWL_API_KEY environment variable is not set.");
	console.error("Please set it in your .env file or environment.");
	process.exit(1);
}

async function main() {
	// Create client
	const client = new PostCrawlClient({ apiKey: API_KEY });

	try {
		// Search Reddit and TikTok
		const results = await client.search({
			socialPlatforms: ["reddit", "tiktok"],
			query: "python",
			results: 5,
			page: 1,
		});

		// Print results
		console.log(`Found ${results.length} posts:`);

		for (const post of results) {
			console.log(`\n- ${post.title}`);
			console.log(`  URL: ${post.url}`);
			console.log(`  Date: ${post.date}`);
			console.log(
				`  Snippet: ${
					post.snippet.length > 100
						? `${post.snippet.substring(0, 100)}...`
						: post.snippet
				}`,
			);
			if (post.imageUrl) {
				console.log(`  Image: ${post.imageUrl}`);
			}
		}

		// Show rate limit info
		console.log("\nRate Limit Info:");
		console.log(`  Limit: ${client.rateLimitInfo.limit}`);
		console.log(`  Remaining: ${client.rateLimitInfo.remaining}`);
		console.log(`  Reset: ${client.rateLimitInfo.reset}`);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

main();
