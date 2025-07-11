/**
 * PostCrawl API client.
 */

import { z } from 'zod'
import {
  API_VERSION,
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY,
  DEFAULT_TIMEOUT,
  EXTRACT_ENDPOINT,
  RATE_LIMIT_HEADER,
  RATE_LIMIT_REMAINING_HEADER,
  RATE_LIMIT_RESET_HEADER,
  SEARCH_AND_EXTRACT_ENDPOINT,
  SEARCH_ENDPOINT,
  USER_AGENT,
} from './constants'
import {
  APIError,
  AuthenticationError,
  InsufficientCreditsError,
  NetworkError,
  PostCrawlError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from './exceptions'
import {
  ErrorDetail,
  ErrorResponse,
  ExtractRequest,
  ExtractResponse,
  ResponseMode,
  SearchAndExtractRequest,
  SearchAndExtractResponse,
  SearchRequest,
  SearchResponse,
  SocialPlatform,
  createExtractedPost,
  extractRequestSchema,
  mapSearchResult,
  searchAndExtractRequestSchema,
  searchRequestSchema,
} from './types'

export interface PostCrawlClientOptions {
  apiKey: string
  timeout?: number
  maxRetries?: number
  retryDelay?: number
}

export class PostCrawlClient {
  /**
   * PostCrawl API client for searching and extracting content from social media.
   * 
   * @example
   * ```typescript
   * const client = new PostCrawlClient({ apiKey: "sk_..." })
   * 
   * // Search for content
   * const results = await client.search({
   *   socialPlatforms: ["reddit"],
   *   query: "machine learning",
   *   results: 10,
   *   page: 1
   * })
   * 
   * // Extract content from URLs
   * const posts = await client.extract({
   *   urls: ["https://reddit.com/..."],
   *   includeComments: true
   * })
   * ```
   */
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly maxRetries: number
  private readonly retryDelay: number

  public rateLimitInfo: {
    limit: number | null
    remaining: number | null
    reset: number | null
  } = {
    limit: null,
    remaining: null,
    reset: null,
  }

  constructor(options: PostCrawlClientOptions) {
    if (!options.apiKey) {
      throw new Error('API key is required')
    }

    if (!options.apiKey.startsWith('sk_')) {
      throw new Error("API key must start with 'sk_'")
    }

    this.apiKey = options.apiKey
    this.baseUrl = DEFAULT_BASE_URL
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
    this.retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY
  }

  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get(RATE_LIMIT_HEADER)
    const remaining = headers.get(RATE_LIMIT_REMAINING_HEADER)
    const reset = headers.get(RATE_LIMIT_RESET_HEADER)

    if (limit) this.rateLimitInfo.limit = parseInt(limit, 10)
    if (remaining) this.rateLimitInfo.remaining = parseInt(remaining, 10)
    if (reset) this.rateLimitInfo.reset = parseInt(reset, 10)
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorResponse: ErrorResponse
    try {
      errorResponse = await response.json() as ErrorResponse
    } catch {
      errorResponse = {
        error: 'Unknown error',
        message: response.statusText || `HTTP ${response.status}`,
      }
    }

    const requestId = errorResponse.request_id

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorResponse.message, { requestId, response })
      case 403:
        throw new InsufficientCreditsError(errorResponse.message, { requestId, response })
      case 422:
        throw new ValidationError(errorResponse.message, {
          details: errorResponse.details,
          requestId,
          response,
        })
      case 429:
        const retryAfter = response.headers.get('Retry-After')
        throw new RateLimitError(errorResponse.message, {
          retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
          requestId,
          response,
        })
      default:
        throw new APIError(errorResponse.message, response.status, { requestId, response })
    }
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    json?: any,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}/${API_VERSION}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/json',
        },
        body: json ? JSON.stringify(json) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Update rate limit info
      this.updateRateLimitInfo(response.headers)

      // Check for errors
      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      return await response.json() as T
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timed out', error)
      }

      if (error instanceof PostCrawlError) {
        throw error
      }

      // Network error - retry if applicable
      if (retryCount < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeRequest<T>(method, endpoint, json, retryCount + 1)
      }

      throw new NetworkError(`Network error: ${error.message}`, error)
    }
  }

  async search(params: {
    socialPlatforms: SocialPlatform[]
    query: string
    results: number
    page: number
  }): Promise<SearchResponse> {
    /**
     * Search for content across social media platforms.
     * 
     * @returns List of SearchResult objects with title, url, snippet, date, and imageUrl
     * 
     * @throws ValidationError - If request parameters are invalid
     * @throws AuthenticationError - If API key is invalid
     * @throws InsufficientCreditsError - If account has insufficient credits
     * @throws RateLimitError - If rate limit is exceeded
     * @throws APIError - For other API errors
     */
    let request: SearchRequest
    try {
      request = searchRequestSchema.parse({
        social_platforms: params.socialPlatforms,
        query: params.query,
        results: params.results,
        page: params.page,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: ErrorDetail[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          code: 'invalid_value',
          message: err.message,
        }))
        throw new ValidationError('Invalid request parameters', { details })
      }
      throw error
    }

    const response = await this.makeRequest<any[]>('POST', SEARCH_ENDPOINT, request)
    return response.map(mapSearchResult)
  }

  async extract(params: {
    urls: string[]
    includeComments?: boolean
    responseMode?: ResponseMode
  }): Promise<ExtractResponse> {
    /**
     * Extract content from social media URLs.
     * 
     * @returns List of extracted posts with content
     * 
     * @throws ValidationError - If request parameters are invalid
     * @throws AuthenticationError - If API key is invalid
     * @throws InsufficientCreditsError - If account has insufficient credits
     * @throws RateLimitError - If rate limit is exceeded
     * @throws APIError - For other API errors
     */
    let request: ExtractRequest
    try {
      request = extractRequestSchema.parse({
        urls: params.urls,
        include_comments: params.includeComments,
        response_mode: params.responseMode,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: ErrorDetail[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          code: 'invalid_value',
          message: err.message,
        }))
        throw new ValidationError('Invalid request parameters', { details })
      }
      throw error
    }

    const response = await this.makeRequest<any[]>('POST', EXTRACT_ENDPOINT, request)
    return response.map(createExtractedPost)
  }

  async searchAndExtract(params: {
    socialPlatforms: SocialPlatform[]
    query: string
    results: number
    page: number
    includeComments?: boolean
    responseMode?: ResponseMode
  }): Promise<SearchAndExtractResponse> {
    /**
     * Search for content and extract it in a single operation.
     * 
     * @returns List of extracted posts from search results
     * 
     * @throws ValidationError - If request parameters are invalid
     * @throws AuthenticationError - If API key is invalid
     * @throws InsufficientCreditsError - If account has insufficient credits
     * @throws RateLimitError - If rate limit is exceeded
     * @throws APIError - For other API errors
     */
    let request: SearchAndExtractRequest
    try {
      request = searchAndExtractRequestSchema.parse({
        social_platforms: params.socialPlatforms,
        query: params.query,
        results: params.results,
        page: params.page,
        include_comments: params.includeComments,
        response_mode: params.responseMode,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: ErrorDetail[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          code: 'invalid_value',
          message: err.message,
        }))
        throw new ValidationError('Invalid request parameters', { details })
      }
      throw error
    }

    const response = await this.makeRequest<any[]>(
      'POST',
      SEARCH_AND_EXTRACT_ENDPOINT,
      request
    )
    return response.map(createExtractedPost)
  }

  // Synchronous convenience methods
  searchSync(_params: {
    socialPlatforms: SocialPlatform[]
    query: string
    results: number
    page: number
  }): SearchResponse {
    /**
     * Synchronous version of search().
     */
    throw new Error(
      'Synchronous methods are not supported in the browser. Use the async methods instead.'
    )
  }

  extractSync(_params: {
    urls: string[]
    includeComments?: boolean
    responseMode?: ResponseMode
  }): ExtractResponse {
    /**
     * Synchronous version of extract().
     */
    throw new Error(
      'Synchronous methods are not supported in the browser. Use the async methods instead.'
    )
  }

  searchAndExtractSync(_params: {
    socialPlatforms: SocialPlatform[]
    query: string
    results: number
    page: number
    includeComments?: boolean
    responseMode?: ResponseMode
  }): SearchAndExtractResponse {
    /**
     * Synchronous version of searchAndExtract().
     */
    throw new Error(
      'Synchronous methods are not supported in the browser. Use the async methods instead.'
    )
  }
}