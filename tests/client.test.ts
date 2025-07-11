/**
 * Tests for PostCrawl client functionality.
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { PostCrawlClient } from '../src/client'
import {
  APIError,
  AuthenticationError,
  InsufficientCreditsError,
  NetworkError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from '../src/exceptions'
import { ExtractedPost, SearchResult } from '../src/types'
import {
  apiKey,
  invalidApiKey,
  mockSearchResponse,
  mockExtractResponse,
  mockErrorResponse,
  mockRateLimitHeaders,
} from './fixtures'

// Mock fetch globally
const mockFetch = mock()
global.fetch = mockFetch as any

describe('TestClientInitialization', () => {
  it('test valid api key', () => {
    const client = new PostCrawlClient({ apiKey })
    expect(client).toBeDefined()
    expect(client.rateLimitInfo.limit).toBeNull()
    expect(client.rateLimitInfo.remaining).toBeNull()
    expect(client.rateLimitInfo.reset).toBeNull()
  })

  it('test invalid api key format', () => {
    expect(() => new PostCrawlClient({ apiKey: 'invalid_key' })).toThrow(
      "API key must start with 'sk_'"
    )
  })

  it('test empty api key', () => {
    expect(() => new PostCrawlClient({ apiKey: '' })).toThrow('API key is required')
  })

  it('test custom parameters', () => {
    const client = new PostCrawlClient({
      apiKey,
      timeout: 30000,
      maxRetries: 5,
      retryDelay: 2000,
    })
    expect(client).toBeDefined()
  })
})

describe('TestSearchEndpoint', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('test search success', async () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '200',
      'X-RateLimit-Remaining': '199',
      'X-RateLimit-Reset': '1703725200',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers,
      json: async () => mockSearchResponse,
    })

    const client = new PostCrawlClient({ apiKey })
    const results = await client.search({
      socialPlatforms: ['reddit'],
      query: 'machine learning',
      results: 10,
      page: 1,
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      title: 'Understanding Machine Learning Basics',
      url: expect.stringContaining('reddit.com'),
      snippet: expect.stringContaining('machine learning'),
      date: 'Dec 28, 2024',
      imageUrl: 'https://preview.redd.it/ml-basics.jpg',
    })

    // Check rate limit info was updated
    expect(client.rateLimitInfo.limit).toBe(200)
    expect(client.rateLimitInfo.remaining).toBe(199)
  })

  it('test search empty results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => [],
    })

    const client = new PostCrawlClient({ apiKey })
    const results = await client.search({
      socialPlatforms: ['reddit', 'tiktok'],
      query: 'very specific query with no results',
      results: 10,
      page: 1,
    })

    expect(results).toHaveLength(0)
  })

  it('test search validation error', async () => {
    const client = new PostCrawlClient({ apiKey })

    await expect(
      client.search({
        socialPlatforms: [],
        query: 'test',
        results: 10,
        page: 1,
      })
    ).rejects.toThrow(ValidationError)
  })

  it('test search authentication error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({
        error: 'invalid_api_key',
        message: 'Invalid API key provided',
        request_id: 'req_123',
      }),
    })

    const client = new PostCrawlClient({ apiKey })

    await expect(
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test',
        results: 10,
        page: 1,
      })
    ).rejects.toThrow(AuthenticationError)
  })

  it('test search rate limit error', async () => {
    const headers = new Headers({
      'Retry-After': '60',
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers,
      json: async () => ({
        error: 'rate_limit_exceeded',
        message: 'Too many requests',
        request_id: 'req_456',
      }),
    })

    const client = new PostCrawlClient({ apiKey })

    try {
      await client.search({
        socialPlatforms: ['reddit'],
        query: 'test',
        results: 10,
        page: 1,
      })
      expect.fail('Should have thrown RateLimitError')
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError)
      expect((error as RateLimitError).retryAfter).toBe(60)
    }
  })
})

describe('TestExtractEndpoint', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('test extract success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockExtractResponse,
    })

    const client = new PostCrawlClient({ apiKey })
    const posts = await client.extract({
      urls: [
        'https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/',
        'https://www.tiktok.com/@pythontutor/video/7123456789012345678',
      ],
      includeComments: false,
    })

    expect(posts).toHaveLength(3)

    const redditPost = posts[0]
    expect(redditPost.url).toBe('https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/')
    expect(redditPost.source).toBe('reddit')
    expect(redditPost.raw).toBeDefined()
    expect(redditPost.error).toBeNull()

    const tiktokPost = posts[1]
    expect(tiktokPost.source).toBe('tiktok')
    expect(tiktokPost.raw).toBeDefined()

    const errorPost = posts[2]
    expect(errorPost.error).toBe('Failed to extract content: Invalid URL')
    expect(errorPost.raw).toBeNull()
  })

  it('test extract with comments', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockExtractResponse,
    })

    const client = new PostCrawlClient({ apiKey })
    const posts = await client.extract({
      urls: ['https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/'],
      includeComments: true,
      responseMode: 'markdown',
    })

    expect(posts).toHaveLength(3)
  })

  it('test extract validation error', async () => {
    const client = new PostCrawlClient({ apiKey })

    await expect(
      client.extract({
        urls: [],
      })
    ).rejects.toThrow(ValidationError)

    await expect(
      client.extract({
        urls: ['not-a-valid-url'],
      })
    ).rejects.toThrow(ValidationError)
  })
})

describe('TestSearchAndExtractEndpoint', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('test search and extract success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockExtractResponse,
    })

    const client = new PostCrawlClient({ apiKey })
    const posts = await client.searchAndExtract({
      socialPlatforms: ['reddit'],
      query: 'python tutorial',
      results: 10,
      page: 1,
      includeComments: true,
    })

    expect(posts).toHaveLength(3)
    expect(posts[0].source).toBe('reddit')
  })

  it('test search and extract validation error', async () => {
    const client = new PostCrawlClient({ apiKey })

    await expect(
      client.searchAndExtract({
        socialPlatforms: [],
        query: '',
        results: 10,
        page: 1,
      })
    ).rejects.toThrow(ValidationError)
  })
})

describe('TestNetworkErrors', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('test timeout error', async () => {
    // Mock fetch to reject with AbortError
    mockFetch.mockImplementationOnce(() => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    })

    const client = new PostCrawlClient({ apiKey, timeout: 50 })

    await expect(
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test',
        results: 10,
        page: 1,
      })
    ).rejects.toThrow(TimeoutError)
  })

  it('test network error with retry', async () => {
    let attempts = 0
    mockFetch.mockImplementation(() => {
      attempts++
      if (attempts < 3) {
        throw new Error('Network error')
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => [],
      })
    })

    const client = new PostCrawlClient({ apiKey, maxRetries: 2, retryDelay: 10 })
    const results = await client.search({
      socialPlatforms: ['reddit'],
      query: 'test',
      results: 10,
      page: 1,
    })

    expect(results).toHaveLength(0)
    expect(attempts).toBe(3)
  })
})

describe('TestSyncMethods', () => {
  it('test sync methods throw error', () => {
    const client = new PostCrawlClient({ apiKey })

    expect(() =>
      client.searchSync({
        socialPlatforms: ['reddit'],
        query: 'test',
        results: 10,
        page: 1,
      })
    ).toThrow('Synchronous methods are not supported')

    expect(() =>
      client.extractSync({
        urls: ['https://example.com'],
      })
    ).toThrow('Synchronous methods are not supported')

    expect(() =>
      client.searchAndExtractSync({
        socialPlatforms: ['reddit'],
        query: 'test',
        results: 10,
        page: 1,
      })
    ).toThrow('Synchronous methods are not supported')
  })
})