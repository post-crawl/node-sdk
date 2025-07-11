#!/usr/bin/env tsx
/**
 * Search and extract example - PostCrawl SDK 101
 */

import { config } from "dotenv";
import { isRedditPost, isTiktokPost, PostCrawlClient } from "../src";

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
		console.log(
			'🔍 Searching and extracting posts about "machine learning"...\n',
		);

		// Search and extract in one operation
		const posts = await client.searchAndExtract({
			socialPlatforms: ["reddit", "tiktok"],
			query: "machine learning tutorial",
			results: 3,
			page: 1,
			includeComments: false,
			responseMode: "markdown",
		});

		console.log(`Found and extracted ${posts.length} posts:\n`);

		// Process each post
		for (const post of posts) {
			console.log(`${"=".repeat(60)}`);
			console.log(`URL: ${post.url}`);
			console.log(`Platform: ${post.source.toUpperCase()}`);

			if (post.error) {
				console.error(`Error: ${post.error}`);
				continue;
			}

			// If we have markdown, display it
			if (post.markdown) {
				console.log("\n📄 Markdown Content:");
				console.log(post.markdown.substring(0, 500));
				if (post.markdown.length > 500) {
					console.log("... [truncated]");
				}
			}

			// Show raw data summary
			if (post.raw) {
				console.log("\n📊 Quick Stats:");

				if (isRedditPost(post.raw)) {
					console.log(`  - Subreddit: r/${post.raw.subredditName}`);
					console.log(`  - Author: u/${post.raw.name}`);
					console.log(`  - Score: ${post.raw.score}`);
				}

				if (isTiktokPost(post.raw)) {
					console.log(`  - Username: @${post.raw.username}`);
					console.log(`  - Likes: ${post.raw.likes}`);
					console.log(
						`  - Comments: ${post.raw.totalComments.toLocaleString()}`,
					);
				}
			}

			console.log();
		}

		// Show credit usage estimation
		console.log("💳 Estimated Credit Usage:");
		console.log(`  - Search: ~${Math.ceil(posts.length / 10)} credit(s)`);
		console.log(`  - Extract: ~${posts.length} credit(s)`);
		console.log(
			`  - Total: ~${Math.ceil(posts.length / 10) + posts.length} credit(s)`,
		);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

main();
