import { writable } from 'svelte/store';
import type { PersistedStore } from '../types/auth';
import {
	saveToStorage,
	loadFromStorage,
	removeFromStorage,
	performDataMigration,
	verifyDataIntegrity,
	cleanupCorruptedData
} from './storage';

// Enhanced persisted store with debouncing, validation, and data integrity
export const createPersistedStore = <T>(
	key: string,
	initialValue: T,
	validator?: (data: unknown) => T | null
): PersistedStore<T> => {
	// Initialize data migration and integrity checking
	performDataMigration();

	// Validate and load initial data with integrity verification
	const rawStored = loadFromStorage(key);
	let validatedStored: T;

	if (validator && rawStored !== null) {
		const validated = validator(rawStored);
		validatedStored = validated ?? initialValue;

		// If validation failed, clear invalid data
		if (validated === null && rawStored !== null) {
			console.warn(`Invalid data found in localStorage for key ${key}, clearing...`);
			removeFromStorage(key);
		}
	} else {
		validatedStored = rawStored ?? initialValue;
	}

	// Verify data integrity on store creation
	const isDataIntact = verifyDataIntegrity();
	if (!isDataIntact) {
		console.warn(`Data integrity check failed for ${key}, using fallback data`);
		// Use initial value if integrity check fails
		validatedStored = initialValue;
		// Schedule integrity repair in next tick
		setTimeout(() => {
			console.log('Scheduling data integrity repair...');
			cleanupCorruptedData();
		}, 100);
	}

	const { subscribe, set, update } = writable<T>(validatedStored);

	// Debounce storage writes to prevent excessive localStorage operations
	let saveTimeout: NodeJS.Timeout | null = null;
	const debouncedSave = (value: T) => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(() => {
			if (value === null || value === undefined) {
				removeFromStorage(key);
			} else {
				// Additional validation before saving
				if (validator) {
					const validatedValue = validator(value);
					if (validatedValue !== null) {
						const saveSuccess = saveToStorage(key, validatedValue);
						if (!saveSuccess) {
							console.warn(`Failed to save data to ${key} - storage quota or corruption issue`);
						}
					} else {
						console.warn(`Invalid data prevented from saving to ${key}`);
						removeFromStorage(key);
					}
				} else {
					const saveSuccess = saveToStorage(key, value);
					if (!saveSuccess) {
						console.warn(`Failed to save data to ${key} - storage quota or corruption issue`);
					}
				}
			}
			saveTimeout = null;
		}, 100); // 100ms debounce delay
	};

	return {
		subscribe,
		set: (value: T) => {
			set(value);
			debouncedSave(value);
		},
		update: (updater: (value: T) => T) => {
			update((current) => {
				const newValue = updater(current);
				debouncedSave(newValue);
				return newValue;
			});
		},
		// Method to immediately save without debouncing (for critical operations)
		forceSync: () => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
				saveTimeout = null;
			}
			// Get current value and save it immediately
			let currentValue: T;
			const unsubscribe = subscribe((value) => {
				currentValue = value;
			});
			unsubscribe();

			if (currentValue! === null || currentValue! === undefined) {
				removeFromStorage(key);
			} else {
				if (validator) {
					const validatedValue = validator(currentValue!);
					if (validatedValue !== null) {
						const saveSuccess = saveToStorage(key, validatedValue);
						if (!saveSuccess) {
							console.warn(`Force sync failed for ${key} - storage issue detected`);
						}
					} else {
						removeFromStorage(key);
					}
				} else {
					const saveSuccess = saveToStorage(key, currentValue!);
					if (!saveSuccess) {
						console.warn(`Force sync failed for ${key} - storage issue detected`);
					}
				}
			}
		}
	};
};
