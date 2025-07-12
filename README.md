# PostCrawl Node.js SDK

Official Node.js/TypeScript SDK for [PostCrawl](https://postcrawl.com) - The Fastest LLM-Ready Social Media Crawler. Extract and search content from Reddit and TikTok with a simple, type-safe TypeScript interface.

## Features

- 🔍 **Search** across Reddit and TikTok with advanced filtering
- 📊 **Extract** content from social media URLs with optional comments
- 🚀 **Combined search and extract** in a single operation
- 🏷️ **Type-safe** with TypeScript and Zod validation
- ⚡ **Async/await** support with Promise-based API
- 🛡️ **Comprehensive error handling** with detailed exceptions
- 📈 **Rate limiting** support with credit tracking
- 🔄 **Automatic retries** for network errors
- 🎯 **Platform-specific models** for Reddit and TikTok data with strong typing
- 📝 **Rich content formatting** with markdown support
- 🐍 **Node.js 18+** with modern ES modules and CommonJS support

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
- TypeScript 5.0+ (for TypeScript users)

## Quick Start

```typescript
import { PostCrawlClient } from 'postcrawl'

// Initialize the client
const pc = new PostCrawlClient({
  apiKey: 'sk_your_api_key_here',
})

// Search for content
const searchResults = await pc.search({
  socialPlatforms: ['reddit', 'tiktok'],
  query: 'artificial intelligence',
  results: 10,
  page: 1,
})

// Extract content from URLs
const posts = await pc.extract({
  urls: [
    'https://www.reddit.com/r/technology/comments/...',
    'https://www.tiktok.com/@user/video/...',
  ],
  includeComments: true,
})

// Search and extract in one operation
const extractedPosts = await pc.searchAndExtract({
  socialPlatforms: ['reddit'],
  query: 'machine learning tutorials',
  results: 5,
  page: 1,
  includeComments: true,
})
```

## API Reference

### Client Initialization

```typescript
const pc = new PostCrawlClient({
  apiKey: string,           // Required: Your PostCrawl API key (starts with 'sk_')
  timeout?: number,         // Optional: Request timeout in ms (default: 90000)
  maxRetries?: number,      // Optional: Max retry attempts (default: 3)
  retryDelay?: number,      // Optional: Delay between retries in ms (default: 1000)
})
```

### Search

Search for content across social media platforms.

```typescript
const results = await pc.search({
  socialPlatforms: ['reddit', 'tiktok'],  // Platforms to search
  query: 'your search query',             // Search query
  results: 10,                            // Number of results (max 100)
  page: 1,                                // Page number (starts at 1)
})

// Returns: SearchResult[]
// {
//   title: string
//   url: string
//   snippet: string
//   date: string
//   imageUrl: string
// }
```

### Extract

Extract content from social media URLs.

```typescript
const posts = await pc.extract({
  urls: ['url1', 'url2'],           // URLs to extract (max 100)
  includeComments?: boolean,        // Include comments (default: false)
  responseMode?: 'raw' | 'markdown' // Response format (default: 'raw')
})

// Returns: ExtractedPost[]
// {
//   url: string
//   source: 'reddit' | 'tiktok'
//   raw?: RedditPost | TiktokPost
//   markdown?: string
//   error?: string
// }
```

### Search and Extract

Combine search and extraction in a single operation.

```typescript
const posts = await pc.searchAndExtract({
  socialPlatforms: ['reddit', 'tiktok'],
  query: 'your search query',
  results: 10,
  page: 1,
  includeComments?: boolean,
  responseMode?: 'raw' | 'markdown'
})
```

## Type-Safe Platform Data

The SDK provides strongly-typed platform-specific data models:

### Reddit Post
```typescript
interface RedditPost {
  id: string
  title: string
  subredditName: string
  description: string
  url: string
  upvotes: number
  downvotes: number
  score: number
  createdAt: string
  comments?: RedditComment[]
}
```

### TikTok Post
```typescript
interface TiktokPost {
  id: string
  username: string
  description: string
  url: string
  likes: string
  totalComments: number
  hashtags: string[]
  createdAt: string
  comments?: TiktokComment[]
}
```

## Error Handling

The SDK provides detailed error types for different scenarios:

```typescript
import {
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  ValidationError,
  NetworkError,
  TimeoutError,
} from 'postcrawl'

try {
  const results = await pc.search({...})
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key')
  } else if (error instanceof InsufficientCreditsError) {
    console.error('Not enough credits')
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after: ${error.retryAfter}s`)
  } else if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.details)
  }
}
```

## Rate Limiting

The client automatically tracks rate limit information:

```typescript
// After any API call
console.log(pc.rateLimitInfo)
// {
//   limit: 200,
//   remaining: 199,
//   reset: 1703725200
// }
```

## Environment Variables

You can load your API key from environment variables:

```typescript
import 'dotenv/config'
import { PostCrawlClient } from 'postcrawl'

const pc = new PostCrawlClient({
  apiKey: process.env.POSTCRAWL_API_KEY!,
})
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions. All methods, parameters, and responses are fully typed for an excellent development experience.

## Examples

### Search Reddit for AI discussions

```typescript
const results = await pc.search({
  socialPlatforms: ['reddit'],
  query: 'artificial intelligence breakthrough',
  results: 20,
  page: 1,
})

for (const result of results) {
  console.log(`${result.title} - ${result.url}`)
}
```

### Extract Reddit post with comments

```typescript
const posts = await pc.extract({
  urls: ['https://www.reddit.com/r/technology/comments/...'],
  includeComments: true,
  responseMode: 'raw',
})

const post = posts[0]
if (post.raw && post.source === 'reddit') {
  const redditPost = post.raw as RedditPost
  console.log(`Post: ${redditPost.title}`)
  console.log(`Comments: ${redditPost.comments?.length || 0}`)
}
```

### Search and extract TikTok videos

```typescript
const posts = await pc.searchAndExtract({
  socialPlatforms: ['tiktok'],
  query: '#programming #tutorial',
  results: 5,
  page: 1,
  includeComments: false,
})

for (const post of posts) {
  if (post.source === 'tiktok' && post.raw) {
    const tiktok = post.raw as TiktokPost
    console.log(`@${tiktok.username}: ${tiktok.description}`)
  }
}
```

## License

MIT - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- Documentation: [https://github.com/post-crawl/node-sdk](https://github.com/post-crawl/node-sdk)
- Issues: [https://github.com/post-crawl/node-sdk/issues](https://github.com/post-crawl/node-sdk/issues)
- API Documentation: [https://postcrawl.com/docs](https://postcrawl.com/docs)