#!/usr/bin/env tsx
/**
 * Content extraction example - PostCrawl SDK 101
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
	const pc = new PostCrawlClient({ apiKey: API_KEY });

	try {
		// Extract content from multiple URLs
		const posts = await pc.extract({
			urls: [
				"https://www.reddit.com/r/cs50/comments/1ltbkiq/cs50_python_fjnal_project_ideas/",
				"https://www.tiktok.com/@britacooks/video/7397065165805473054",
			],
			includeComments: true,
			responseMode: "raw",
		});

		// Process each extracted post
		for (const post of posts) {
			console.log(`\n${"=".repeat(60)}`);
			console.log(`URL: ${post.url}`);
			console.log(`Platform: ${post.source}`);

			if (post.error) {
				console.error(`Error: ${post.error}`);
				continue;
			}

			// Handle Reddit posts
			if (isRedditPost(post.raw)) {
				console.log("\n📱 Reddit Post:");
				console.log(`  Subreddit: r/${post.raw.subredditName}`);
				console.log(`  Title: ${post.raw.title}`);
				console.log(`  Author: u/${post.raw.name}`);
				console.log(
					`  Score: ${post.raw.score} (⬆️ ${post.raw.upvotes} / ⬇️ ${post.raw.downvotes})`,
				);
				console.log(`  Created: ${post.raw.createdAt}`);

				if (post.raw.description) {
					console.log("\n  Content:");
					console.log(
						`  ${post.raw.description.substring(0, 200)}${post.raw.description.length > 200 ? "..." : ""}`,
					);
				}

				if (post.raw.comments && post.raw.comments.length > 0) {
					console.log("\n  Top Comments:");
					post.raw.comments.slice(0, 3).forEach((comment, idx) => {
						console.log(
							`    ${idx + 1}. "${comment.text.substring(0, 100)}..." (Score: ${comment.score})`,
						);
					});
				}
			}

			// Handle TikTok posts
			if (isTiktokPost(post.raw)) {
				console.log("\n🎵 TikTok Video:");
				console.log(`  Username: @${post.raw.username}`);
				console.log(`  Description: ${post.raw.description}`);
				console.log(`  Likes: ${post.raw.likes}`);
				console.log(`  Comments: ${post.raw.totalComments.toLocaleString()}`);
				console.log(`  Created: ${post.raw.createdAt}`);

				if (post.raw.hashtags && post.raw.hashtags.length > 0) {
					console.log(
						`  Hashtags: ${post.raw.hashtags.map((tag) => `#${tag}`).join(" ")}`,
					);
				}

				if (post.raw.comments && post.raw.comments.length > 0) {
					console.log("\n  Top Comments:");
					post.raw.comments.slice(0, 3).forEach((comment, idx) => {
						console.log(
							`    ${idx + 1}. @${comment.username}: "${comment.text.substring(0, 80)}..."`,
						);
					});
				}
			}
		}
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

main();
