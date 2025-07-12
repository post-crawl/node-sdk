/**
 * PostCrawl API exceptions.
 */

import type { ErrorDetail } from "./types";

/**
 * Base exception for all PostCrawl errors.
 */
export class PostCrawlError extends Error {
	public readonly requestId?: string;
	public readonly response?: Response;

	constructor(message: string, requestId?: string, response?: Response) {
		super(message);
		this.name = "PostCrawlError";
		this.requestId = requestId;
		this.response = response;
	}
}

/**
 * General API error.
 */
export class APIError extends PostCrawlError {
	public readonly statusCode: number;

	constructor(
		message: string,
		statusCode: number,
		requestId?: string,
		response?: Response,
	) {
		super(message, requestId, response);
		this.name = "APIError";
		this.statusCode = statusCode;
	}
}

/**
 * Raised when API key is invalid or missing.
 */
export class AuthenticationError extends APIError {
	constructor(
		message = "Invalid or missing API key",
		requestId?: string,
		response?: Response,
	) {
		super(message, 401, requestId, response);
		this.name = "AuthenticationError";
	}
}

/**
 * Raised when account has insufficient credits.
 */
export class InsufficientCreditsError extends APIError {
	public readonly creditsRequired?: number;
	public readonly creditsAvailable?: number;

	constructor(
		message = "Insufficient credits",
		creditsRequired?: number,
		creditsAvailable?: number,
		requestId?: string,
		response?: Response,
	) {
		super(message, 403, requestId, response);
		this.name = "InsufficientCreditsError";
		this.creditsRequired = creditsRequired;
		this.creditsAvailable = creditsAvailable;
	}
}

/**
 * Raised when rate limit is exceeded.
 */
export class RateLimitError extends APIError {
	public readonly retryAfter?: number;

	constructor(
		message = "Rate limit exceeded",
		retryAfter?: number,
		requestId?: string,
		response?: Response,
	) {
		super(message, 429, requestId, response);
		this.name = "RateLimitError";
		this.retryAfter = retryAfter;
	}
}

/**
 * Raised when request validation fails.
 */
export class ValidationError extends APIError {
	public readonly details: ErrorDetail[];

	constructor(
		message: string,
		details: ErrorDetail[] = [],
		requestId?: string,
		response?: Response,
	) {
		super(message, 422, requestId, response);
		this.name = "ValidationError";
		this.details = details;
	}
}

/**
 * Raised when a network error occurs.
 */
export class NetworkError extends PostCrawlError {
	public readonly originalError?: Error;

	constructor(message: string, originalError?: Error) {
		super(message);
		this.name = "NetworkError";
		this.originalError = originalError;
	}
}

/**
 * Raised when a request times out.
 */
export class TimeoutError extends NetworkError {
	constructor(message = "Request timed out", originalError?: Error) {
		super(message, originalError);
		this.name = "TimeoutError";
	}
}
