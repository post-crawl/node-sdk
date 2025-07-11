/**
 * Tests for PostCrawl async operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PostCrawlClient } from '../src/client'
import { TimeoutError } from '../src/exceptions'
import { apiKey, mockSearchResponse, mockExtractResponse } from './fixtures'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('TestAsyncOperations', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('handles concurrent search requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockSearchResponse,
    })

    const client = new PostCrawlClient({ apiKey })

    const promises = [
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test1',
        results: 10,
        page: 1,
      }),
      client.search({
        socialPlatforms: ['tiktok'],
        query: 'test2',
        results: 10,
        page: 1,
      }),
      client.search({
        socialPlatforms: ['reddit', 'tiktok'],
        query: 'test3',
        results: 10,
        page: 1,
      }),
    ]

    const results = await Promise.all(promises)

    expect(results).toHaveLength(3)
    results.forEach((result) => {
      expect(result).toHaveLength(2)
    })
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('handles concurrent extract requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockExtractResponse,
    })

    const client = new PostCrawlClient({ apiKey })

    const promises = [
      client.extract({
        urls: ['https://reddit.com/post1'],
        includeComments: true,
      }),
      client.extract({
        urls: ['https://tiktok.com/video1'],
        includeComments: false,
      }),
    ]

    const results = await Promise.all(promises)

    expect(results).toHaveLength(2)
    results.forEach((result) => {
      expect(result).toHaveLength(3)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('handles mixed concurrent requests', async () => {
    mockFetch.mockImplementation(async (url) => {
      const endpoint = url.split('/').pop()
      if (endpoint === 'search') {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockSearchResponse,
        }
      } else if (endpoint === 'extract') {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockExtractResponse,
        }
      } else {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockExtractResponse,
        }
      }
    })

    const client = new PostCrawlClient({ apiKey })

    const promises = [
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test',
        results: 10,
        page: 1,
      }),
      client.extract({
        urls: ['https://reddit.com/test'],
      }),
      client.searchAndExtract({
        socialPlatforms: ['tiktok'],
        query: 'test',
        results: 5,
        page: 1,
      }),
    ]

    const [searchResults, extractResults, searchExtractResults] = await Promise.all(promises)

    expect(searchResults).toHaveLength(2)
    expect(extractResults).toHaveLength(3)
    expect(searchExtractResults).toHaveLength(3)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('properly propagates errors in concurrent requests', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockSearchResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: async () => ({
          error: 'invalid_api_key',
          message: 'Invalid API key',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockSearchResponse,
      })

    const client = new PostCrawlClient({ apiKey })

    const promises = [
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test1',
        results: 10,
        page: 1,
      }),
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test2',
        results: 10,
        page: 1,
      }),
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test3',
        results: 10,
        page: 1,
      }),
    ]

    const results = await Promise.allSettled(promises)

    expect(results[0].status).toBe('fulfilled')
    expect(results[1].status).toBe('rejected')
    expect(results[2].status).toBe('fulfilled')

    if (results[1].status === 'rejected') {
      expect(results[1].reason.name).toBe('AuthenticationError')
    }
  })

  it('respects timeout in async operations', async () => {
    // Mock fetch to reject with AbortError after delay
    mockFetch.mockImplementationOnce(() => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    })

    const client = new PostCrawlClient({ apiKey, timeout: 100 })

    await expect(
      client.search({
        socialPlatforms: ['reddit'],
        query: 'test',
        results: 10,
        page: 1,
      })
    ).rejects.toThrow(TimeoutError)
  })
})