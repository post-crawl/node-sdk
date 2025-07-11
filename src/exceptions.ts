/**
 * PostCrawl API exceptions.
 */

import { ErrorDetail } from './types'

export class PostCrawlError extends Error {
  /**
   * Base exception for all PostCrawl errors.
   */
  public readonly requestId?: string
  public readonly response?: any

  constructor(message: string, options?: { requestId?: string; response?: any }) {
    super(message)
    this.name = 'PostCrawlError'
    this.requestId = options?.requestId
    this.response = options?.response
  }
}

export class APIError extends PostCrawlError {
  /**
   * General API error.
   */
  public readonly statusCode: number

  constructor(
    message: string,
    statusCode: number,
    options?: { requestId?: string; response?: any }
  ) {
    super(message, options)
    this.name = 'APIError'
    this.statusCode = statusCode
  }
}

export class AuthenticationError extends APIError {
  /**
   * Raised when API key is invalid or missing.
   */
  constructor(
    message: string = 'Invalid or missing API key',
    options?: { requestId?: string; response?: any }
  ) {
    super(message, 401, options)
    this.name = 'AuthenticationError'
  }
}

export class InsufficientCreditsError extends APIError {
  /**
   * Raised when account has insufficient credits.
   */
  public readonly creditsRequired?: number
  public readonly creditsAvailable?: number

  constructor(
    message: string = 'Insufficient credits',
    options?: {
      creditsRequired?: number
      creditsAvailable?: number
      requestId?: string
      response?: any
    }
  ) {
    super(message, 403, options)
    this.name = 'InsufficientCreditsError'
    this.creditsRequired = options?.creditsRequired
    this.creditsAvailable = options?.creditsAvailable
  }
}

export class RateLimitError extends APIError {
  /**
   * Raised when rate limit is exceeded.
   */
  public readonly retryAfter?: number

  constructor(
    message: string = 'Rate limit exceeded',
    options?: { retryAfter?: number; requestId?: string; response?: any }
  ) {
    super(message, 429, options)
    this.name = 'RateLimitError'
    this.retryAfter = options?.retryAfter
  }
}

export class ValidationError extends APIError {
  /**
   * Raised when request validation fails.
   */
  public readonly details: ErrorDetail[]

  constructor(
    message: string,
    options?: { details?: ErrorDetail[]; requestId?: string; response?: any }
  ) {
    super(message, 422, options)
    this.name = 'ValidationError'
    this.details = options?.details || []
  }
}

export class NetworkError extends PostCrawlError {
  /**
   * Raised when a network error occurs.
   */
  public readonly originalError?: Error

  constructor(message: string, originalError?: Error) {
    super(message)
    this.name = 'NetworkError'
    this.originalError = originalError
  }
}

export class TimeoutError extends NetworkError {
  /**
   * Raised when a request times out.
   */
  constructor(message: string = 'Request timed out', originalError?: Error) {
    super(message, originalError)
    this.name = 'TimeoutError'
  }
}