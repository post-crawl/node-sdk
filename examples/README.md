# PostCrawl SDK Examples

This directory contains example scripts demonstrating how to use the PostCrawl Node.js SDK.

## Prerequisites

1. Install dependencies:
   ```bash
   bun install
   # or npm install
   ```

2. Set up your API key:
   - Create a `.env` file in the root directory
   - Add your API key: `POSTCRAWL_API_KEY=sk_your_api_key_here`
   - Or modify the examples to include your API key directly

## Examples

### 1. Search Example (`search_101.ts`)

Demonstrates how to search for content across social media platforms.

```bash
bun run examples/search_101.ts
# or npx tsx examples/search_101.ts
```

Features:
- Search Reddit for AI-related content
- Display formatted search results
- Show rate limit information

### 2. Extract Example (`extract_101.ts`)

Shows how to extract content from social media URLs.

```bash
bun run examples/extract_101.ts
# or npx tsx examples/extract_101.ts
```

Features:
- Extract Reddit and TikTok posts
- Include comments in extraction
- Handle platform-specific data
- Error handling for failed extractions

### 3. Search and Extract Example (`search_and_extract_101.ts`)

Combines search and extraction in a single operation.

```bash
bun run examples/search_and_extract_101.ts
# or npx tsx examples/search_and_extract_101.ts
```

Features:
- Search for Python tutorials
- Extract full content from search results
- Display formatted content with comments
- Comprehensive error handling
- API usage tracking

## Notes

- Replace example URLs with actual Reddit/TikTok URLs when testing extraction
- The API key can be set via environment variable or directly in code
- Rate limits apply to all API operations
- Search results are limited to 100 per request
- Extract operations are limited to 100 URLs per request

## Error Handling

All examples include error handling for common scenarios:
- Invalid API key
- Insufficient credits
- Rate limiting
- Network errors
- Validation errors

## Support

For more information, visit:
- [PostCrawl Documentation](https://postcrawl.com/docs)
- [SDK Repository](https://github.com/post-crawl/node-sdk)