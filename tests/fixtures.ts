/**
 * Test fixtures for PostCrawl SDK tests
 */

import type { ExtractedPost, SearchResult } from "../src/types";

export const mockSearchResponse: SearchResult[] = [
	{
		title: "Understanding Machine Learning Basics",
		url: "https://www.reddit.com/r/MachineLearning/comments/1ab2c3d/understanding_machine_learning_basics/",
		snippet:
			"A comprehensive guide to machine learning fundamentals including supervised and unsupervised learning...",
		date: "Dec 28, 2024",
		imageUrl: "https://preview.redd.it/ml-basics.jpg",
	},
	{
		title: "Python Tutorial for Beginners",
		url: "https://www.tiktok.com/@pythontutor/video/7123456789012345678",
		snippet:
			"Learn Python programming from scratch with this beginner-friendly tutorial series...",
		date: "Dec 27, 2024",
		imageUrl: "",
	},
];

export const mockExtractResponse: ExtractedPost[] = [
	{
		url: "https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/",
		source: "reddit",
		raw: {
			id: "1ab2c3d",
			subredditName: "Python",
			title: "Test Post Title",
			name: "test_user",
			description: "This is the post content",
			score: 42,
			upvotes: 45,
			downvotes: 3,
			createdAt: "2024-12-28T10:00:00Z",
			url: "https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/",
			comments: [],
		},
		markdown: null,
		error: null,
	},
	{
		url: "https://www.tiktok.com/@pythontutor/video/7123456789012345678",
		source: "tiktok",
		raw: {
			id: "7123456789012345678",
			username: "pythontutor",
			description: "Learn Python in 60 seconds! #python #programming #tutorial",
			likes: "1523",
			comments: [],
			totalComments: 45,
			createdAt: "2024-12-27T15:30:00Z",
			url: "https://www.tiktok.com/@pythontutor/video/7123456789012345678",
			hashtags: ["python", "programming", "tutorial"],
		},
		markdown: null,
		error: null,
	},
	{
		url: "https://invalid.url/post",
		source: "reddit",
		raw: null,
		markdown: null,
		error: "Failed to extract content: Invalid URL",
	},
];

export const mockRateLimitHeaders = {
	"X-RateLimit-Limit": "200",
	"X-RateLimit-Remaining": "150",
	"X-RateLimit-Reset": "1703725200",
};
