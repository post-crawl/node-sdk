# PostCrawl Node.js SDK Examples

This directory contains example scripts demonstrating how to use the PostCrawl Node.js SDK.

## Prerequisites

1. Get your API key from [PostCrawl Dashboard](https://postcrawl.com/dashboard)
2. Set the environment variable:
   ```bash
   export POSTCRAWL_API_KEY="sk_your_api_key_here"
   ```
   Or create a `.env` file in the project root:
   ```
   POSTCRAWL_API_KEY=sk_your_api_key_here
   ```

## Available Examples

### search_101.ts - Basic Search

Demonstrates how to search for content across Reddit and TikTok.

```bash
bun run example:search
```

Features shown:
- Searching multiple platforms
- Handling search results
- Accessing rate limit information

### extract_101.ts - Content Extraction

Shows how to extract full content from social media URLs.

```bash
bun run example:extract
```

Features shown:
- Extracting from multiple URLs
- Including comments
- Handling platform-specific data
- Error handling for failed extractions

### search_and_extract_101.ts - Combined Operation

Demonstrates searching and extracting in a single API call.

```bash
bun run example:sne
```

Features shown:
- Combined search and extract
- Markdown response mode
- Credit usage estimation
- Processing extracted content

## Running All Examples

To run all examples in sequence:

```bash
bun run examples
```

## Example Output

### Search Example
```
Found 5 posts:

- Understanding Machine Learning Basics
  URL: https://www.reddit.com/r/MachineLearning/comments/...
  Date: Dec 28, 2024
  Snippet: A comprehensive guide to machine learning fundamentals...

Rate Limit Info:
  Limit: 200
  Remaining: 150
  Reset: 1703725200
```

### Extract Example
```
============================================================
URL: https://www.reddit.com/r/Python/comments/...
Platform: reddit

📱 Reddit Post:
  Subreddit: r/Python
  Title: What's the most useful Python library you've discovered?
  Author: u/python_learner
  Score: 42 (⬆️ 45 / ⬇️ 3)
  Comments: 10
  Created: 2024-12-28T10:00:00Z

  Content:
  I've been learning Python for a few months now and...

  Top Comments:
    1. "I'd say pandas for data manipulation..." (Score: 15)
    2. "requests is a game changer for APIs..." (Score: 12)
```

## Tips

1. **API Key Security**: Never commit your API key to version control
2. **Rate Limits**: Check `client.rateLimitInfo` to monitor your usage
3. **Error Handling**: Always wrap API calls in try/catch blocks
4. **Platform Detection**: Use type guards (`isRedditPost`, `isTiktokPost`) for type-safe access

## Customization

Feel free to modify these examples for your use case:
- Change search queries
- Add different URLs to extract
- Modify response modes (raw vs markdown)
- Adjust result counts and pagination

## Need Help?

- Check the [SDK Documentation](../README.md)
- View [API Documentation](https://postcrawl.com/docs)
- Contact support@postcrawl.com