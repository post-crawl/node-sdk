/**
 * Tests for PostCrawl exception classes.
 */

import { describe, it, expect } from 'bun:test'
import {
  PostCrawlError,
  APIError,
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  ValidationError,
  NetworkError,
  TimeoutError,
} from '../src/exceptions'

describe('TestExceptionClasses', () => {
  it('PostCrawlError base class', () => {
    const error = new PostCrawlError('Test error', {
      requestId: 'req_123',
      response: { status: 500 },
    })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(PostCrawlError)
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('PostCrawlError')
    expect(error.requestId).toBe('req_123')
    expect(error.response).toEqual({ status: 500 })
  })

  it('APIError with status code', () => {
    const error = new APIError('API failed', 500, {
      requestId: 'req_456',
    })

    expect(error).toBeInstanceOf(PostCrawlError)
    expect(error).toBeInstanceOf(APIError)
    expect(error.message).toBe('API failed')
    expect(error.name).toBe('APIError')
    expect(error.statusCode).toBe(500)
    expect(error.requestId).toBe('req_456')
  })

  it('AuthenticationError defaults', () => {
    const error = new AuthenticationError()

    expect(error).toBeInstanceOf(APIError)
    expect(error.message).toBe('Invalid or missing API key')
    expect(error.name).toBe('AuthenticationError')
    expect(error.statusCode).toBe(401)
  })

  it('AuthenticationError custom message', () => {
    const error = new AuthenticationError('Custom auth error', {
      requestId: 'req_789',
    })

    expect(error.message).toBe('Custom auth error')
    expect(error.requestId).toBe('req_789')
  })

  it('InsufficientCreditsError with credit details', () => {
    const error = new InsufficientCreditsError('Not enough credits', {
      creditsRequired: 100,
      creditsAvailable: 50,
      requestId: 'req_001',
    })

    expect(error).toBeInstanceOf(APIError)
    expect(error.name).toBe('InsufficientCreditsError')
    expect(error.statusCode).toBe(403)
    expect(error.creditsRequired).toBe(100)
    expect(error.creditsAvailable).toBe(50)
  })

  it('RateLimitError with retry after', () => {
    const error = new RateLimitError('Too many requests', {
      retryAfter: 60,
      requestId: 'req_002',
    })

    expect(error).toBeInstanceOf(APIError)
    expect(error.name).toBe('RateLimitError')
    expect(error.statusCode).toBe(429)
    expect(error.retryAfter).toBe(60)
  })

  it('ValidationError with details', () => {
    const details = [
      { field: 'query', code: 'required', message: 'Query is required' },
      { field: 'results', code: 'max', message: 'Results cannot exceed 100' },
    ]

    const error = new ValidationError('Validation failed', {
      details,
      requestId: 'req_003',
    })

    expect(error).toBeInstanceOf(APIError)
    expect(error.name).toBe('ValidationError')
    expect(error.statusCode).toBe(422)
    expect(error.details).toEqual(details)
  })

  it('NetworkError with original error', () => {
    const originalError = new Error('Connection failed')
    const error = new NetworkError('Network request failed', originalError)

    expect(error).toBeInstanceOf(PostCrawlError)
    expect(error.name).toBe('NetworkError')
    expect(error.message).toBe('Network request failed')
    expect(error.originalError).toBe(originalError)
  })

  it('TimeoutError extends NetworkError', () => {
    const originalError = new Error('Timeout')
    const error = new TimeoutError('Request timed out', originalError)

    expect(error).toBeInstanceOf(NetworkError)
    expect(error).toBeInstanceOf(PostCrawlError)
    expect(error.name).toBe('TimeoutError')
    expect(error.originalError).toBe(originalError)
  })

  it('TimeoutError default message', () => {
    const error = new TimeoutError()

    expect(error.message).toBe('Request timed out')
  })
})

describe('TestErrorInheritance', () => {
  it('all errors inherit from PostCrawlError', () => {
    const errors = [
      new APIError('test', 500),
      new AuthenticationError(),
      new InsufficientCreditsError(),
      new RateLimitError(),
      new ValidationError('test'),
      new NetworkError('test'),
      new TimeoutError(),
    ]

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(PostCrawlError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  it('API errors inherit from APIError', () => {
    const apiErrors = [
      new AuthenticationError(),
      new InsufficientCreditsError(),
      new RateLimitError(),
      new ValidationError('test'),
    ]

    apiErrors.forEach((error) => {
      expect(error).toBeInstanceOf(APIError)
      expect(error.statusCode).toBeDefined()
    })
  })
})