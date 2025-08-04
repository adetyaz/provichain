export interface RetryConfig {
	maxAttempts: number;
	delay: number;
	backoffMultiplier: number;
	maxDelay: number;
}

export enum ErrorType {
	NETWORK = 'network',
	WALLET_EXTENSION = 'wallet_extension',
	WALLET_LOCKED = 'wallet_locked',
	PERMISSION_DENIED = 'permission_denied',
	INVALID_STATE = 'invalid_state',
	UNKNOWN = 'unknown'
}
