import { browser } from '$app/environment';

// Storage keys with versioning for data migration
export const STORAGE_KEYS = {
	CONNECTED_WALLET: 'provichain_connected_wallet',
	USER_DATA: 'provichain_user_data',
	DATA_VERSION: 'provichain_data_version',
	DATA_CHECKSUM: 'provichain_data_checksum'
};

// Current data schema version for migration support
export const CURRENT_DATA_VERSION = '1.0.0';

// Data integrity helpers
export const generateDataChecksum = (): string => {
	if (!browser) return '';

	try {
		// Generate checksum based on our critical data keys
		const criticalKeys = [STORAGE_KEYS.CONNECTED_WALLET, STORAGE_KEYS.USER_DATA];
		const dataString = criticalKeys
			.map((key) => {
				const value = localStorage.getItem(key);
				return `${key}:${value || ''}`;
			})
			.join('|');

		// Simple hash function (for basic integrity checking)
		let hash = 0;
		for (let i = 0; i < dataString.length; i++) {
			const char = dataString.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}

		return hash.toString(36);
	} catch (error) {
		console.warn('Failed to generate data checksum:', error);
		return '';
	}
};

export const updateDataChecksum = () => {
	if (browser) {
		const checksum = generateDataChecksum();
		if (checksum) {
			localStorage.setItem(STORAGE_KEYS.DATA_CHECKSUM, checksum);
		}
	}
};

export const verifyDataIntegrity = (): boolean => {
	if (!browser) return true;

	try {
		const storedChecksum = localStorage.getItem(STORAGE_KEYS.DATA_CHECKSUM);
		if (!storedChecksum) {
			// No checksum exists, generate one for future use
			updateDataChecksum();
			return true;
		}

		const currentChecksum = generateDataChecksum();
		const isIntact = storedChecksum === currentChecksum;

		if (!isIntact) {
			console.warn('Data integrity verification failed - potential corruption detected');
		}

		return isIntact;
	} catch (error) {
		console.warn('Failed to verify data integrity:', error);
		return false;
	}
};

export const checkStorageQuota = (estimatedSize: number): boolean => {
	if (!browser) return true;

	try {
		// Try to estimate available storage space
		const testKey = 'provichain_quota_test';
		const testData = 'x'.repeat(Math.min(estimatedSize, 1024)); // Test with sample data

		localStorage.setItem(testKey, testData);
		localStorage.removeItem(testKey);

		return true;
	} catch (error) {
		// If we get a quota exceeded error, storage is full
		if (error instanceof Error && error.name === 'QuotaExceededError') {
			console.warn('localStorage quota exceeded');
			return false;
		}

		// For other errors, assume we have space
		return true;
	}
};

export const performDataMigration = () => {
	if (!browser) return;

	try {
		const storedVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);

		if (!storedVersion) {
			// First time setup - initialize version
			localStorage.setItem(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
			updateDataChecksum();
			console.log('Initialized data versioning system');
			return;
		}

		if (storedVersion !== CURRENT_DATA_VERSION) {
			console.log(`Data migration needed: ${storedVersion} → ${CURRENT_DATA_VERSION}`);

			// Future migrations would go here
			// For now, we're at version 1.0.0 so no migrations needed

			// Update version after successful migration
			localStorage.setItem(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
			updateDataChecksum();
		}
	} catch (error) {
		console.warn('Data migration failed:', error);
	}
};

export const cleanupCorruptedData = () => {
	if (!browser) return;

	console.log('Cleaning up corrupted localStorage data...');

	try {
		// Remove our app's data
		Object.values(STORAGE_KEYS).forEach((key) => {
			try {
				localStorage.removeItem(key);
			} catch (error) {
				console.warn(`Failed to remove corrupted key ${key}:`, error);
			}
		});

		// Initialize fresh state
		performDataMigration();

		console.log('Corrupted data cleanup completed');
	} catch (error) {
		console.warn('Failed to cleanup corrupted data:', error);
	}
};

// Helper functions for localStorage with enhanced data integrity
export const saveToStorage = (key: string, value: unknown): boolean => {
	if (browser) {
		try {
			const serializedValue = JSON.stringify(value);

			// Check storage quota before saving
			const estimatedSize = key.length + serializedValue.length;
			if (!checkStorageQuota(estimatedSize)) {
				console.warn('Insufficient localStorage quota for save operation');
				return false;
			}

			localStorage.setItem(key, serializedValue);

			// Update data integrity checksum
			updateDataChecksum();

			return true;
		} catch (error) {
			console.warn('Failed to save to localStorage:', error);
			return false;
		}
	}
	return false;
};

export const loadFromStorage = (key: string) => {
	if (browser) {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (error) {
			console.warn('Failed to load from localStorage:', error);
			// Attempt to repair corrupted data
			console.log('Attempting to repair corrupted localStorage data...');
			removeFromStorage(key);
			return null;
		}
	}
	return null;
};

export const removeFromStorage = (key: string) => {
	if (browser) {
		try {
			localStorage.removeItem(key);
			// Update checksum after removal
			updateDataChecksum();
		} catch (error) {
			console.warn('Failed to remove from localStorage:', error);
		}
	}
};
