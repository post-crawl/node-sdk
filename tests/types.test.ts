/**
 * Tests for PostCrawl type definitions and validation.
 */

import { describe, it, expect } from 'bun:test'
import {
  extractRequestSchema,
  searchRequestSchema,
  searchAndExtractRequestSchema,
  isRedditPost,
  isTiktokPost,
  mapSearchResult,
  createExtractedPost,
  ExtractedPost,
  RedditPost,
  TiktokPost,
} from '../src/types'
import { mockRedditPost, mockTiktokPost } from './fixtures'

describe('TestRequestValidation', () => {
  describe('SearchRequest validation', () => {
    it('validates valid search request', () => {
      const valid = {
        social_platforms: ['reddit', 'tiktok'],
        query: 'machine learning',
        results: 10,
        page: 1,
      }

      const result = searchRequestSchema.parse(valid)
      expect(result).toEqual(valid)
    })

    it('rejects empty query', () => {
      const invalid = {
        social_platforms: ['reddit'],
        query: '',
        results: 10,
        page: 1,
      }

      expect(() => searchRequestSchema.parse(invalid)).toThrow()
    })

    it('rejects empty social platforms', () => {
      const invalid = {
        social_platforms: [],
        query: 'test',
        results: 10,
        page: 1,
      }

      expect(() => searchRequestSchema.parse(invalid)).toThrow()
    })

    it('rejects invalid social platform', () => {
      const invalid = {
        social_platforms: ['reddit', 'facebook'] as any,
        query: 'test',
        results: 10,
        page: 1,
      }

      expect(() => searchRequestSchema.parse(invalid)).toThrow()
    })

    it('rejects results over 100', () => {
      const invalid = {
        social_platforms: ['reddit'],
        query: 'test',
        results: 101,
        page: 1,
      }

      expect(() => searchRequestSchema.parse(invalid)).toThrow()
    })

    it('rejects negative page', () => {
      const invalid = {
        social_platforms: ['reddit'],
        query: 'test',
        results: 10,
        page: -1,
      }

      expect(() => searchRequestSchema.parse(invalid)).toThrow()
    })
  })

  describe('ExtractRequest validation', () => {
    it('validates valid extract request', () => {
      const valid = {
        urls: ['https://www.reddit.com/r/test/comments/123/test/'],
        include_comments: true,
        response_mode: 'markdown' as const,
      }

      const result = extractRequestSchema.parse(valid)
      expect(result).toEqual(valid)
    })

    it('sets default values', () => {
      const minimal = {
        urls: ['https://example.com'],
      }

      const result = extractRequestSchema.parse(minimal)
      expect(result.include_comments).toBe(false)
      expect(result.response_mode).toBe('raw')
    })

    it('rejects empty urls', () => {
      const invalid = {
        urls: [],
      }

      expect(() => extractRequestSchema.parse(invalid)).toThrow()
    })

    it('rejects too many urls', () => {
      const invalid = {
        urls: Array(101).fill('https://example.com'),
      }

      expect(() => extractRequestSchema.parse(invalid)).toThrow()
    })

    it('rejects invalid urls', () => {
      const invalid = {
        urls: ['not-a-url', 'https://valid.com'],
      }

      expect(() => extractRequestSchema.parse(invalid)).toThrow()
    })

    it('rejects invalid response mode', () => {
      const invalid = {
        urls: ['https://example.com'],
        response_mode: 'invalid' as any,
      }

      expect(() => extractRequestSchema.parse(invalid)).toThrow()
    })
  })

  describe('SearchAndExtractRequest validation', () => {
    it('validates valid search and extract request', () => {
      const valid = {
        social_platforms: ['reddit'],
        query: 'test query',
        results: 20,
        page: 2,
        include_comments: true,
        response_mode: 'markdown' as const,
      }

      const result = searchAndExtractRequestSchema.parse(valid)
      expect(result).toEqual(valid)
    })

    it('trims query whitespace', () => {
      const request = {
        social_platforms: ['reddit'],
        query: '  test query  ',
        results: 10,
        page: 1,
      }

      const result = searchAndExtractRequestSchema.parse(request)
      expect(result.query).toBe('test query')
    })
  })
})

describe('TestTypeGuards', () => {
  it('correctly identifies Reddit posts', () => {
    expect(isRedditPost(mockRedditPost)).toBe(true)
    expect(isRedditPost(mockTiktokPost)).toBe(false)
    expect(isRedditPost(null)).toBe(false)
    expect(isRedditPost({})).toBe(false)
  })

  it('correctly identifies TikTok posts', () => {
    expect(isTiktokPost(mockTiktokPost)).toBe(true)
    expect(isTiktokPost(mockRedditPost)).toBe(false)
    expect(isTiktokPost(null)).toBe(false)
    expect(isTiktokPost({})).toBe(false)
  })
})

describe('TestSearchResultMapping', () => {
  it('maps API response to SearchResult', () => {
    const apiResponse = {
      title: 'Test Title',
      url: 'https://example.com',
      snippet: 'Test snippet',
      date: 'Jan 1, 2024',
      imageUrl: 'https://example.com/image.jpg',
    }

    const result = mapSearchResult(apiResponse)
    expect(result).toEqual({
      title: 'Test Title',
      url: 'https://example.com',
      snippet: 'Test snippet',
      date: 'Jan 1, 2024',
      imageUrl: 'https://example.com/image.jpg',
    })
  })

  it('handles missing imageUrl', () => {
    const apiResponse = {
      title: 'Test Title',
      url: 'https://example.com',
      snippet: 'Test snippet',
      date: 'Jan 1, 2024',
    }

    const result = mapSearchResult(apiResponse)
    expect(result.imageUrl).toBe('')
  })
})

describe('TestExtractedPostMethods', () => {
  it('ExtractedPost platform getter works', () => {
    const post = createExtractedPost({
      url: 'https://reddit.com/test',
      source: 'reddit',
      raw: mockRedditPost as RedditPost,
      markdown: null,
      error: null,
    })

    expect(post.platform).toBe('reddit')
  })

  it('ExtractedPost type checking methods work', () => {
    const redditExtract = createExtractedPost({
      url: 'https://reddit.com/test',
      source: 'reddit',
      raw: mockRedditPost as RedditPost,
      markdown: null,
      error: null,
    })

    expect(redditExtract.isRedditPost()).toBe(true)
    expect(redditExtract.isTiktokPost()).toBe(false)
    expect(redditExtract.getRedditPost()).toEqual(mockRedditPost)
    expect(redditExtract.getTiktokPost()).toBeNull()
  })
})