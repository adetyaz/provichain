import { browser } from '$app/environment';
import {
	verifyDataIntegrity,
	checkStorageQuota,
	performDataMigration,
	updateDataChecksum,
	STORAGE_KEYS,
	loadFromStorage,
	removeFromStorage
} from './storage';
import { validateStoredWalletInfo, validateStoredUser } from './validation';
import { CURRENT_DATA_VERSION } from './storage';
import type { StorageHealthResult } from '../types/storage';

// Public function to manually check and repair localStorage health
export const checkStorageHealth = (): StorageHealthResult => {
	const issues: string[] = [];
	const repaired: string[] = [];

	if (!browser) {
		return { isHealthy: true, issues: [], repaired: [] };
	}

	try {
		// Check data integrity
		const isIntegrityOk = verifyDataIntegrity();
		if (!isIntegrityOk) {
			issues.push('Data integrity checksum mismatch detected');
		}

		// Check storage quota
		const hasSpace = checkStorageQuota(1024); // Test with 1KB
		if (!hasSpace) {
			issues.push('localStorage quota exceeded or nearly full');
		}

		// Validate stored data structure
		const walletData = loadFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
		const userData = loadFromStorage(STORAGE_KEYS.USER_DATA);

		if (walletData !== null) {
			const validWallet = validateStoredWalletInfo(walletData);
			if (!validWallet) {
				issues.push('Invalid wallet data structure detected');
				// Auto-repair by removing invalid data
				removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
				repaired.push('Removed corrupted wallet data');
			}
		}

		if (userData !== null) {
			const validUser = validateStoredUser(userData);
			if (!validUser) {
				issues.push('Invalid user data structure detected');
				// Auto-repair by removing invalid data
				removeFromStorage(STORAGE_KEYS.USER_DATA);
				repaired.push('Removed corrupted user data');
			}
		}

		// Check version compatibility
		const storedVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
		if (storedVersion && storedVersion !== CURRENT_DATA_VERSION) {
			issues.push(`Data version mismatch: ${storedVersion} vs ${CURRENT_DATA_VERSION}`);
			// Auto-repair by triggering migration
			performDataMigration();
			repaired.push('Performed data migration');
		}

		// If we found and fixed issues, regenerate checksum
		if (repaired.length > 0) {
			updateDataChecksum();
			repaired.push('Updated data integrity checksum');
		}

		const isHealthy = issues.length === 0;

		console.log(`Storage health check: ${isHealthy ? 'HEALTHY' : 'ISSUES FOUND'}`);
		if (issues.length > 0) {
			console.log('Issues found:', issues);
		}
		if (repaired.length > 0) {
			console.log('Auto-repairs performed:', repaired);
		}

		return { isHealthy, issues, repaired };
	} catch (error) {
		console.error('Storage health check failed:', error);
		return {
			isHealthy: false,
			issues: ['Storage health check failed due to critical error'],
			repaired: []
		};
	}
};
