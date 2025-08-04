import type { RetryConfig } from '../types/error-recovery';
import { ErrorType } from '../types/error-recovery';

// Re-export ErrorType for external use
export { ErrorType };

// Classify errors for appropriate retry strategies
export const classifyError = (error: unknown): ErrorType => {
	if (!error) return ErrorType.UNKNOWN;

	const errorMessage =
		error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

	if (
		errorMessage.includes('network') ||
		errorMessage.includes('fetch') ||
		errorMessage.includes('timeout')
	) {
		return ErrorType.NETWORK;
	}

	if (
		errorMessage.includes('wallet not found') ||
		errorMessage.includes('extension') ||
		errorMessage.includes('not available')
	) {
		return ErrorType.WALLET_EXTENSION;
	}

	if (errorMessage.includes('locked') || errorMessage.includes('unlock')) {
		return ErrorType.WALLET_LOCKED;
	}

	if (
		errorMessage.includes('permission') ||
		errorMessage.includes('denied') ||
		errorMessage.includes('rejected')
	) {
		return ErrorType.PERMISSION_DENIED;
	}

	if (
		errorMessage.includes('invalid') ||
		errorMessage.includes('state') ||
		errorMessage.includes('corrupted')
	) {
		return ErrorType.INVALID_STATE;
	}

	return ErrorType.UNKNOWN;
};

// Determine if an error is retryable
export const isRetryableError = (errorType: ErrorType): boolean => {
	switch (errorType) {
		case ErrorType.NETWORK:
		case ErrorType.WALLET_EXTENSION: // Extension might be temporarily unavailable
		case ErrorType.UNKNOWN: // Give unknown errors a chance
			return true;
		case ErrorType.WALLET_LOCKED:
		case ErrorType.PERMISSION_DENIED:
		case ErrorType.INVALID_STATE:
			return false;
	}
};

// Get retry configuration based on error type
export const getRetryConfig = (errorType: ErrorType): RetryConfig => {
	switch (errorType) {
		case ErrorType.NETWORK:
			return { maxAttempts: 3, delay: 1000, backoffMultiplier: 2, maxDelay: 8000 };
		case ErrorType.WALLET_EXTENSION:
			return { maxAttempts: 2, delay: 2000, backoffMultiplier: 1.5, maxDelay: 5000 };
		case ErrorType.UNKNOWN:
			return { maxAttempts: 2, delay: 1500, backoffMultiplier: 2, maxDelay: 6000 };
		default:
			return { maxAttempts: 1, delay: 0, backoffMultiplier: 1, maxDelay: 0 };
	}
};

// Generic retry function with exponential backoff
export const retryWithBackoff = async <T>(
	operation: () => Promise<T>,
	config: RetryConfig,
	operationName: string
): Promise<T> => {
	let lastError: unknown;

	for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
		try {
			console.log(`${operationName} - Attempt ${attempt}/${config.maxAttempts}`);
			return await operation();
		} catch (error) {
			lastError = error;
			const errorType = classifyError(error);

			console.warn(`${operationName} failed on attempt ${attempt}:`, error);
			console.log(`Error classified as: ${errorType}`);

			// Don't retry if this is the last attempt or error is not retryable
			if (attempt === config.maxAttempts || !isRetryableError(errorType)) {
				break;
			}

			// Calculate delay with exponential backoff
			const delay = Math.min(
				config.delay * Math.pow(config.backoffMultiplier, attempt - 1),
				config.maxDelay
			);

			console.log(`Waiting ${delay}ms before retry...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
};
