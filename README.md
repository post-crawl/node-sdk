# PostCrawl Node.js SDK

Official Node.js/TypeScript SDK for [PostCrawl](https://postcrawl.com) - The Fastest LLM-Ready Social Media Crawler. Extract and search content from Reddit and TikTok with a simple, type-safe TypeScript interface.

## Features

- 🔍 **Search** across Reddit and TikTok with advanced filtering
- 📊 **Extract** content from social media URLs with optional comments
- 🚀 **Combined search and extract** in a single operation
- 🏷️ **Type-safe** with full TypeScript support and Zod validation
- ⚡ **Promise-based** API with async/await support
- 🛡️ **Comprehensive error handling** with detailed exceptions
- 📈 **Rate limiting** support with credit tracking
- 🔄 **Automatic retries** for network errors
- 🎯 **Platform-specific types** for Reddit and TikTok data with strong typing
- 📝 **Rich content formatting** with markdown support
- 🐍 **Node.js 18+** with modern ES modules and camelCase naming

## Installation

### Using npm

```bash
npm install postcrawl
```

### Using yarn

```bash
yarn add postcrawl
```

### Using pnpm

```bash
pnpm add postcrawl
```

### Using bun

```bash
bun add postcrawl
```

### Optional: Environment Variables

For loading API keys from .env files:

```bash
npm install dotenv
# or
bun add dotenv
```

## Requirements

- Node.js 18.0 or higher
- PostCrawl API key ([Get one for free](https://postcrawl.com))

## Quick Start

### Basic Usage
```typescript
import { PostCrawlClient } from 'postcrawl';

// Initialize the client with your API key
const pc = new PostCrawlClient({
  apiKey: 'sk_your_api_key_here'
});

// Search for content
const results = await pc.search({
  socialPlatforms: ['reddit'],
  query: 'machine learning',
  results: 10,
  page: 1
});

// Process results
for (const post of results) {
  console.log(`${post.title} - ${post.url}`);
  console.log(`  Date: ${post.date}`);
  console.log(`  Snippet: ${post.snippet.substring(0, 100)}...`);
}
```

### Extract Content
```typescript
// Extract content from URLs
const posts = await pc.extract({
  urls: [
    'https://reddit.com/r/...',
    'https://tiktok.com/@...'
  ],
  includeComments: true,
  responseMode: 'raw'
});

// Process extracted posts
for (const post of posts) {
  if (post.error) {
    console.error(`Failed to extract ${post.url}: ${post.error}`);
  } else {
    console.log(`Extracted from ${post.source}: ${post.url}`);
  }
}
```

### Search and Extract
```typescript
const posts = await pc.searchAndExtract({
  socialPlatforms: ['reddit'],
  query: 'search query',
  results: 5,
  page: 1,
  includeComments: false,
  responseMode: 'markdown'
});
```

## API Reference

### Client Initialization

```typescript
const pc = new PostCrawlClient({
  apiKey: string,           // Required: Your PostCrawl API key (starts with 'sk_')
  timeout?: number,         // Optional: Request timeout in ms (default: 0 = no timeout)
  maxRetries?: number,      // Optional: Max retry attempts (default: 3)
  retryDelay?: number,      // Optional: Delay between retries in ms (default: 1000)
})
```

### Search
```typescript
const results = await pc.search({
  socialPlatforms: ['reddit', 'tiktok'],
  query: 'your search query',
  results: 10,  // 1-100
  page: 1       // pagination
});
```

### Extract
```typescript
const posts = await pc.extract({
  urls: ['https://reddit.com/...', 'https://tiktok.com/...'],
  includeComments: true,
  responseMode: 'raw'  // or 'markdown'
});
```

### Search and Extract
```typescript
const posts = await pc.searchAndExtract({
  socialPlatforms: ['reddit'],
  query: 'search query',
  results: 5,
  page: 1,
  includeComments: false,
  responseMode: 'markdown'
});
```

## Examples

Check out the `examples/` directory for complete working examples:
- [`search_101.ts`](examples/search_101.ts) - Basic search functionality demo
- [`extract_101.ts`](examples/extract_101.ts) - Content extraction demo with Reddit and TikTok
- [`search_and_extract_101.ts`](examples/search_and_extract_101.ts) - Combined operation demo

Run examples with:
```bash
# Using bun (recommended)
bun run examples

# Or run individual examples
bun run example:search
bun run example:extract
bun run example:sne

# Using Node.js with tsx
npx tsx examples/search_101.ts
```

## Response Models

### SearchResult
Response from the search endpoint:
- `title`: Title of the search result
- `url`: URL of the search result
- `snippet`: Text snippet from the content
- `date`: Date of the post (e.g., "Dec 28, 2024")
- `imageUrl`: URL of associated image (can be empty string)

### ExtractedPost
- `url`: Original URL
- `source`: Platform name ("reddit" or "tiktok")
- `raw`: Raw content data (RedditPost or TiktokPost object) - strongly typed
- `markdown`: Markdown formatted content (when responseMode="markdown")
- `error`: Error message if extraction failed

## Working with Platform-Specific Types

The SDK provides type-safe access to platform-specific data:

```typescript
import { PostCrawlClient, isRedditPost, isTiktokPost } from 'postcrawl';

// Extract content with proper type handling
const posts = await pc.extract({
  urls: ['https://reddit.com/...']
});

for (const post of posts) {
  if (post.error) {
    console.error(`Error: ${post.error}`);
  } else if (isRedditPost(post.raw)) {
    // Access Reddit-specific fields with camelCase
    console.log(`Subreddit: r/${post.raw.subredditName}`);
    console.log(`Score: ${post.raw.score}`);
    console.log(`Title: ${post.raw.title}`);
    console.log(`Upvotes: ${post.raw.upvotes}`);
    console.log(`Created: ${post.raw.createdAt}`);
    if (post.raw.comments) {
      console.log(`Comments: ${post.raw.comments.length}`);
    }
  } else if (isTiktokPost(post.raw)) {
    // Access TikTok-specific fields with camelCase
    console.log(`Username: @${post.raw.username}`);
    console.log(`Likes: ${post.raw.likes}`);
    console.log(`Total Comments: ${post.raw.totalComments}`);
    console.log(`Created: ${post.raw.createdAt}`);
    if (post.raw.hashtags) {
      console.log(`Hashtags: ${post.raw.hashtags.join(', ')}`);
    }
  }
}
```

## Error Handling

```typescript
import {
  AuthenticationError,      // Invalid API key
  InsufficientCreditsError, // Not enough credits
  RateLimitError,          // Rate limit exceeded
  ValidationError          // Invalid parameters
} from 'postcrawl';

try {
  const results = await pc.search({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof InsufficientCreditsError) {
    console.error('Insufficient credits:', error.requiredCredits);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.details);
  }
}
```

## Development

This project uses [Bun](https://bun.sh) as the primary runtime and package manager. See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup and contribution guidelines.

### Quick Development Setup

```bash
# Clone the repository
git clone https://github.com/post-crawl/node-sdk.git
cd node-sdk

# Install dependencies
bun install

# Run tests
make test

# Run all checks (format, lint, test)
make check

# Build the package
make build
```

### Available Commands

```bash
make help         # Show all available commands
make format       # Format code with biome
make lint         # Run linting and type checking
make test         # Run test suite
make check        # Run format, lint, and tests
make build        # Build distribution packages
make examples     # Run all examples
```

## API Key Management

### Environment Variables (Recommended)

Store your API key securely in environment variables:

```bash
export POSTCRAWL_API_KEY="sk_your_api_key_here"
```

Or use a `.env` file:
```bash
# .env
POSTCRAWL_API_KEY=sk_your_api_key_here
```

Then load it in your code:
```typescript
import { config } from 'dotenv';
import { PostCrawlClient } from 'postcrawl';

config();
const pc = new PostCrawlClient({
  apiKey: process.env.POSTCRAWL_API_KEY!
});
```

### Security Best Practices

- **Never hardcode API keys** in your source code
- **Add `.env` to `.gitignore`** to prevent accidental commits
- **Use environment variables** in production
- **Rotate keys regularly** through the PostCrawl dashboard
- **Set key permissions** to limit access to specific operations

## Rate Limits & Credits

PostCrawl uses a credit-based system:

- **Search**: ~1 credit per 10 results
- **Extract**: ~1 credit per URL (without comments)
- **Extract with comments**: ~3 credits per URL

Rate limits are tracked automatically:
```typescript
const pc = new PostCrawlClient({ apiKey: 'sk_...' });
const results = await pc.search({ ... });

console.log(`Rate limit: ${pc.rateLimitInfo.limit}`);
console.log(`Remaining: ${pc.rateLimitInfo.remaining}`);
console.log(`Reset at: ${pc.rateLimitInfo.reset}`);
```

## Support

- **Documentation**: [github.com/post-crawl/node-sdk](https://github.com/post-crawl/node-sdk)
- **Issues**: [github.com/post-crawl/node-sdk/issues](https://github.com/post-crawl/node-sdk/issues)
- **Email**: support@postcrawl.com

## License

MIT License - see [LICENSE](LICENSE) file for details.