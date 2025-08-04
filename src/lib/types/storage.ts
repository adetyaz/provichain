// Storage configuration types
export interface StorageKeys {
	CONNECTED_WALLET: string;
	USER_DATA: string;
	DATA_VERSION: string;
	DATA_CHECKSUM: string;
}

// Health check result types
export interface StorageHealthResult {
	isHealthy: boolean;
	issues: string[];
	repaired: string[];
}
