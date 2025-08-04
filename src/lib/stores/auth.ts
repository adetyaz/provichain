import { writable, derived, get } from 'svelte/store';
import { getWallets, WalletName } from '@massalabs/wallet-provider';
import type { Provider } from '@massalabs/massa-web3';
import { browser } from '$app/environment';

// Import modular utilities
import type { User, WalletInfo, PersistedStore } from '../types/auth';
import { RoleAssignmentStrategy } from '../types/auth';
import { createPersistedStore } from './persisted-store';
import { validateStoredWalletInfo, validateStoredUser } from './validation';
import { STORAGE_KEYS, removeFromStorage, cleanupCorruptedData, loadFromStorage } from './storage';
import { ErrorType, classifyError, getRetryConfig, retryWithBackoff } from './error-recovery';
import { validateWalletProviderState, assignUserRole } from './wallet-utils';
import { checkStorageHealth } from './health-check';

// Re-export types and utilities for external use
export type { User, WalletInfo };
export { checkWalletAvailability, getWalletAccounts } from './wallet-utils';
export { checkStorageHealth };

// Session-based manual disconnect tracking (not persisted across browser sessions)
let isManuallyDisconnectedInSession = false;

// Global wallet listener for account changes
let walletListener: { unsubscribe: () => void } | null = null;
let accountChangeDebounceTimer: NodeJS.Timeout | null = null;
let isProcessingAccountChange = false;

// Helper to check if user manually disconnected in current session
export const isManuallyDisconnected = (): boolean => {
	console.log('Checking session manual disconnect flag:', isManuallyDisconnectedInSession);
	return isManuallyDisconnectedInSession;
};

// Helper functions for manual disconnect state
const setManualDisconnectState = (state: boolean) => {
	isManuallyDisconnectedInSession = state;
	console.log('Manual disconnect state set to:', state);
};

const clearManualDisconnectState = () => {
	isManuallyDisconnectedInSession = false;
	console.log('Manual disconnect state cleared - auto-reconnect enabled for session');
};

// Public function to allow users to re-enable auto-reconnect
export const enableAutoReconnect = () => {
	isManuallyDisconnectedInSession = false;
	console.log('Auto-reconnect manually re-enabled by user');
};

// Core wallet state with persistence and validation
export const provider = writable<Provider | null>(null);
export const connectedWallet: PersistedStore<WalletInfo | null> =
	createPersistedStore<WalletInfo | null>(
		STORAGE_KEYS.CONNECTED_WALLET,
		null,
		validateStoredWalletInfo
	);
export const user: PersistedStore<User | null> = createPersistedStore<User | null>(
	STORAGE_KEYS.USER_DATA,
	null,
	validateStoredUser
);
export const isLoading = writable<boolean>(false);
export const walletError = writable<string | null>(null);

// Derived state
export const isConnected = derived(
	[provider, connectedWallet],
	([$provider, $connectedWallet]) => !!$provider && !!$connectedWallet
);

export const currentWalletAddress = derived(
	connectedWallet,
	($connectedWallet) => $connectedWallet?.address || null
);

// Account change handling
const debouncedAccountChangeHandler = (newAddress: string) => {
	if (accountChangeDebounceTimer) {
		clearTimeout(accountChangeDebounceTimer);
	}

	accountChangeDebounceTimer = setTimeout(async () => {
		await handleAccountChange(newAddress);
	}, 500);
};

const handleAccountChange = async (newAddress: string) => {
	if (isProcessingAccountChange) {
		console.log('Account change already in progress, skipping...');
		return;
	}

	try {
		isProcessingAccountChange = true;

		const currentWallet = get(connectedWallet);
		if (!currentWallet || currentWallet.address === newAddress) {
			console.log('Account change is same as current or no current wallet');
			return;
		}

		console.log('Processing account change:', currentWallet.address, '->', newAddress);

		const walletList = await getWallets();
		const walletState = await validateWalletProviderState(newAddress, walletList);

		if (!walletState) {
			console.error('New address not available in current wallet state');
			return;
		}

		const { account: targetAccount, accountIndex: targetAccountIndex } = walletState;
		console.log(`Found target account at index ${targetAccountIndex} for address: ${newAddress}`);

		const newUser: User = {
			address: newAddress,
			did: `did:massa:${newAddress}`,
			role: null,
			name: `User ${newAddress.slice(0, 8)}...`,
			avatar: undefined
		};

		const newWalletInfo: WalletInfo = {
			address: newAddress,
			accountIndex: targetAccountIndex,
			name: `Account ${targetAccountIndex}`,
			shortAddress: `${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`
		};

		provider.set(targetAccount);
		connectedWallet.set(newWalletInfo);
		user.set(newUser);

		console.log('Successfully switched to account:', newAddress);

		// Assign role using centralized system for account switch
		Promise.resolve().then(async () => {
			try {
				console.log('Assigning role for account switch...');
				const assignedRole = await assignUserRole(
					RoleAssignmentStrategy.ACCOUNT_SWITCH,
					newAddress
				);

				if (assignedRole) {
					user.update((u) => (u ? { ...u, role: assignedRole } : u));
					console.log(`Role assigned: ${assignedRole}`);
				} else {
					console.log('No role assigned - user must request via UI');
				}
			} catch (roleError) {
				console.warn('Role assignment failed during account switch:', roleError);
			}
		});
	} catch (error) {
		console.error('Account change failed:', error);

		const errorType = classifyError(error);
		console.log(`Account change error classified as: ${errorType}`);

		switch (errorType) {
			case ErrorType.INVALID_STATE:
			case ErrorType.WALLET_EXTENSION:
				console.log('Critical error during account switch - clearing connection state');
				provider.set(null);
				connectedWallet.set(null);
				user.set(null);
				walletError.set('Account switch failed. Please reconnect manually.');
				break;
			default:
				console.log('Temporary error during account switch - keeping current connection');
				walletError.set('Account switch failed. Current account connection maintained.');
				break;
		}
	} finally {
		isProcessingAccountChange = false;
	}
};

const setupAccountChangeListener = async () => {
	try {
		const walletList = await getWallets();
		if (walletList.length === 0) {
			console.log('No wallets available for account change listener setup');
			return;
		}

		let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);
		if (!wallet) {
			wallet = walletList[0];
			console.log('MassaWallet not found for listener, using:', wallet.name());
		}

		if (!wallet.listenAccountChanges) {
			console.log('Selected wallet does not support account change listening');
			return;
		}

		if (walletListener) {
			walletListener.unsubscribe();
			walletListener = null;
		}

		if (accountChangeDebounceTimer) {
			clearTimeout(accountChangeDebounceTimer);
			accountChangeDebounceTimer = null;
		}

		isProcessingAccountChange = false;

		const listener = wallet.listenAccountChanges?.(async (newAddress: string) => {
			console.log('Wallet account changed to:', newAddress);
			debouncedAccountChangeHandler(newAddress);
		});

		if (listener) {
			walletListener = listener;
			console.log('Account change listener setup successfully');
		}
	} catch (error) {
		console.error('Failed to setup account change listener:', error);
	}
};

// Cleanup wallet listener
export const cleanupAccountChangeListener = () => {
	if (walletListener) {
		walletListener.unsubscribe();
		walletListener = null;
		console.log('Wallet account change listener cleaned up');
	}

	if (accountChangeDebounceTimer) {
		clearTimeout(accountChangeDebounceTimer);
		accountChangeDebounceTimer = null;
		console.log('Account change debounce timer cleared');
	}

	isProcessingAccountChange = false;
};

// Wallet connection function
export const connectWallet = async (selectedAccountIndex?: number) => {
	const performConnection = async (): Promise<void> => {
		console.log('Searching for available wallets...');

		const walletList = await getWallets();
		console.log(
			'Found wallets:',
			walletList.map((w) => w.name())
		);

		let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);

		if (!wallet && walletList.length > 0) {
			wallet = walletList[0];
			console.log('MassaStation not found, using:', wallet.name());
		}

		if (!wallet) {
			throw new Error(
				'No compatible wallet found. Please install MassaStation or another Massa wallet.'
			);
		}

		console.log('Using wallet:', wallet.name());

		const accounts = await wallet.accounts();
		console.log('Found accounts:', accounts.length);
		
		// Enhanced debugging for account structure
		if (accounts.length > 0) {
			console.log('First account detailed structure:');
			console.log('- Type:', typeof accounts[0]);
			console.log('- Constructor:', accounts[0].constructor.name);
			console.log('- Keys:', Object.keys(accounts[0]));
			console.log('- Full object:', accounts[0]);
			
			// Try to get the address from the first account using different methods
			const firstAccount = accounts[0];
			const accountAsRecord = firstAccount as Record<string, unknown>;
			console.log('Address extraction attempts:');
			console.log('- firstAccount.address:', firstAccount.address);
			console.log('- firstAccount.publicKey:', accountAsRecord.publicKey);
			console.log('- firstAccount.name:', accountAsRecord.name);
			console.log('- firstAccount.nickname:', accountAsRecord.nickname);
		}

		if (accounts.length === 0) {
			throw new Error('No accounts found in wallet. Please create an account first.');
		}

		const accountIndex = selectedAccountIndex !== undefined ? selectedAccountIndex : 0;

		if (accountIndex >= accounts.length) {
			throw new Error(
				`Account index ${accountIndex} not available. Only ${accounts.length} accounts found.`
			);
		}

		const walletProvider = accounts[accountIndex];
		console.log('Selected account:', walletProvider, 'Available keys:', Object.keys(walletProvider));
		
		// Handle different possible account structures
		let address: string;
		const accountAsRecord = walletProvider as Record<string, unknown>;
		
		if (walletProvider.address && typeof walletProvider.address === 'string') {
			address = walletProvider.address;
			console.log('✅ Address found via .address property:', address);
		} else if (typeof walletProvider === 'string') {
			address = walletProvider;
			console.log('✅ Account is a string address:', address);
		} else if (accountAsRecord.publicKey && typeof accountAsRecord.publicKey === 'string') {
			// Some wallets might store address as publicKey
			address = accountAsRecord.publicKey;
			console.log('✅ Address found via .publicKey property:', address);
		} else if (accountAsRecord.name && typeof accountAsRecord.name === 'string') {
			// Some wallets might store address as name
			address = accountAsRecord.name;
			console.log('✅ Address found via .name property:', address);
		} else {
			console.error('❌ Unable to extract address from account:');
			console.error('- Account type:', typeof walletProvider);
			console.error('- Account constructor:', walletProvider.constructor.name);
			console.error('- Available keys:', Object.keys(walletProvider));
			console.error('- Full account object:', walletProvider);
			throw new Error(
				`Unable to extract address from wallet account. ` +
				`Expected 'address' property but found: ${Object.keys(walletProvider).join(', ')}. ` +
				`Please check your wallet connection or try a different wallet.`
			);
		}

		console.log('Connecting to account:', address, 'at index:', accountIndex);

		const previousWallet = get(connectedWallet);
		const isNewAccount = !previousWallet || previousWallet.address !== address;

		const newUser: User = {
			address,
			did: `did:massa:${address}`,
			role: null,
			name: `User ${address.slice(0, 8)}...`,
			avatar: undefined
		};

		const walletInfo: WalletInfo = {
			address,
			accountIndex,
			name: `Account ${accountIndex}`,
			shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
		};

		provider.set(walletProvider);
		connectedWallet.set(walletInfo);
		user.set(newUser);

		clearManualDisconnectState();

		console.log('Wallet connected successfully to:', address);

		await setupAccountChangeListener();

		Promise.resolve().then(async () => {
			try {
				const strategy = isNewAccount
					? RoleAssignmentStrategy.MANUAL_NEW
					: RoleAssignmentStrategy.MANUAL_RETURNING;

				console.log(`Assigning role for ${isNewAccount ? 'new' : 'returning'} account...`);
				const assignedRole = await assignUserRole(strategy, address);

				if (assignedRole) {
					user.update((u) => (u ? { ...u, role: assignedRole } : u));
					console.log(`Role assigned: ${assignedRole}`);
				}
			} catch (roleError) {
				console.warn('Role assignment failed during connection:', roleError);
			}
		});
	};

	try {
		isLoading.set(true);
		walletError.set(null);

		const errorType = ErrorType.WALLET_EXTENSION;
		const retryConfig = getRetryConfig(errorType);

		await retryWithBackoff(performConnection, retryConfig, 'Manual wallet connection');
	} catch (error) {
		console.error('Wallet connection failed after all retry attempts:', error);

		const errorType = classifyError(error);
		console.log(`Connection error classified as: ${errorType}`);

		let errorMessage: string;
		switch (errorType) {
			case ErrorType.WALLET_LOCKED:
				errorMessage = 'Wallet is locked. Please unlock your wallet and try again.';
				break;
			case ErrorType.PERMISSION_DENIED:
				errorMessage = 'Connection rejected. Please approve the connection request in your wallet.';
				break;
			case ErrorType.WALLET_EXTENSION:
				errorMessage =
					"Wallet extension not found. Please install MassaStation or check if it's enabled.";
				break;
			case ErrorType.NETWORK:
				errorMessage = 'Network error. Please check your connection and try again.';
				break;
			default:
				errorMessage =
					error instanceof Error ? error.message : 'Unknown error occurred during connection.';
		}

		walletError.set(errorMessage);

		provider.set(null);
		connectedWallet.set(null);
		user.set(null);

		throw error;
	} finally {
		isLoading.set(false);
	}
};

// Switch wallet function
export const switchWallet = async () => {
	try {
		console.log('Switching wallet...');

		if (get(isConnected)) {
			provider.set(null);
			connectedWallet.set(null);
			user.set(null);
			walletError.set(null);
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		await connectWallet();
	} catch (error) {
		console.error('Wallet switch failed:', error);
		throw error;
	}
};

// Disconnect wallet function
export const disconnectWallet = () => {
	console.log('Disconnecting wallet...');

	cleanupAccountChangeListener();
	setManualDisconnectState(true);

	provider.set(null);
	connectedWallet.set(null);
	user.set(null);
	walletError.set(null);

	connectedWallet.forceSync();
	user.forceSync();

	console.log('Wallet disconnected and all data cleared');
};

// Force disconnect and clear all persisted data
export const forceDisconnectWallet = () => {
	console.log('Force disconnecting and clearing all stored data...');

	cleanupAccountChangeListener();
	setManualDisconnectState(true);

	provider.set(null);
	connectedWallet.set(null);
	user.set(null);
	walletError.set(null);

	connectedWallet.forceSync();
	user.forceSync();

	removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
	removeFromStorage(STORAGE_KEYS.USER_DATA);

	if (browser) {
		const keysToRemove = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith('provichain_')) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach((key) => localStorage.removeItem(key));
	}

	console.log('Wallet force disconnected and ALL data cleared');
};

// Reset wallet state completely
export const resetWalletState = () => {
	console.log('Resetting wallet state completely...');

	provider.set(null);
	connectedWallet.set(null);
	user.set(null);
	walletError.set(null);
	isLoading.set(false);

	if (browser) {
		const keysToRemove = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith('provichain_')) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach((key) => localStorage.removeItem(key));
	}

	console.log('Wallet state completely reset');
};

// Public function to force storage cleanup and reset
export const resetStorageState = () => {
	console.log('Performing complete storage state reset...');

	try {
		cleanupCorruptedData();

		provider.set(null);
		connectedWallet.set(null);
		user.set(null);
		walletError.set(null);
		isLoading.set(false);

		isManuallyDisconnectedInSession = false;

		console.log('Storage state reset completed successfully');

		return { success: true, message: 'Storage state reset successfully' };
	} catch (error) {
		console.error('Storage state reset failed:', error);
		return { success: false, message: 'Storage state reset failed' };
	}
};

// Auto-reconnect function
export const autoReconnectWallet = async () => {
	if (!browser || get(provider) || get(isLoading)) {
		console.log('Skipping auto-reconnect: not in browser or already connected/connecting');
		return;
	}

	if (isManuallyDisconnectedInSession) {
		console.log('Skipping auto-reconnect - user manually disconnected in this session');
		connectedWallet.set(null);
		user.set(null);
		return;
	}

	const performAutoReconnect = async (): Promise<void> => {
		console.log('Attempting to auto-reconnect wallet...');

		const rawStoredWalletInfo = loadFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
		const rawStoredUser = loadFromStorage(STORAGE_KEYS.USER_DATA);

		const storedWalletInfo = validateStoredWalletInfo(rawStoredWalletInfo);
		const storedUser = validateStoredUser(rawStoredUser);

		if (!storedWalletInfo || !storedUser) {
			console.log('No valid stored wallet data found - skipping auto-reconnect');
			connectedWallet.set(null);
			user.set(null);
			removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
			removeFromStorage(STORAGE_KEYS.USER_DATA);
			return;
		}

		console.log('Found valid stored data for address:', storedWalletInfo.address);

		const walletList = await getWallets();
		if (walletList.length === 0) {
			throw new Error('No wallets available for reconnection');
		}

		const walletState = await validateWalletProviderState(storedWalletInfo.address, walletList);
		if (!walletState) {
			throw new Error('Previously connected account not available in current wallet state');
		}

		const { account: targetAccount, accountIndex: targetAccountIndex } = walletState;
		console.log(`Found target account at index ${targetAccountIndex}:`, targetAccount.address);

		const reconstructedUser: User = {
			address: storedWalletInfo.address,
			did: storedUser.did,
			role: null,
			name: storedUser.name || `User ${storedWalletInfo.address.slice(0, 8)}...`,
			avatar: storedUser.avatar
		};

		const reconstructedWalletInfo: WalletInfo = {
			address: storedWalletInfo.address,
			accountIndex: targetAccountIndex,
			name: `Account ${targetAccountIndex}`,
			shortAddress: `${storedWalletInfo.address.slice(0, 6)}...${storedWalletInfo.address.slice(-4)}`
		};

		provider.set(targetAccount);
		connectedWallet.set(reconstructedWalletInfo);
		user.set(reconstructedUser);

		console.log('Auto-reconnect successful to:', storedWalletInfo.address);

		await setupAccountChangeListener();

		Promise.resolve().then(async () => {
			try {
				console.log('Assigning role for auto-reconnect...');
				const assignedRole = await assignUserRole(
					RoleAssignmentStrategy.AUTO_RECONNECT,
					storedWalletInfo.address,
					storedUser.role
				);

				if (assignedRole) {
					user.update((u) => (u ? { ...u, role: assignedRole } : u));
					console.log(`Role assigned: ${assignedRole}`);
				}
			} catch (roleError) {
				console.warn('Role assignment failed during auto-reconnect:', roleError);
			}
		});
	};

	try {
		isLoading.set(true);
		walletError.set(null);

		const errorType = ErrorType.NETWORK;
		const retryConfig = getRetryConfig(errorType);

		await retryWithBackoff(performAutoReconnect, retryConfig, 'Auto-reconnect');
	} catch (error) {
		console.error('Auto-reconnect failed after all retry attempts:', error);

		const errorType = classifyError(error);
		console.log(`Final error classified as: ${errorType}`);

		switch (errorType) {
			case ErrorType.WALLET_LOCKED:
				console.log('Wallet is locked - preserving stored data for when user unlocks');
				connectedWallet.set(null);
				user.set(null);
				provider.set(null);
				walletError.set('Wallet is locked. Please unlock your wallet to reconnect.');
				break;

			case ErrorType.PERMISSION_DENIED:
				console.log('Permission denied - user needs to re-authorize');
				connectedWallet.set(null);
				user.set(null);
				provider.set(null);
				walletError.set('Permission denied. Please reconnect manually to re-authorize.');
				break;

			case ErrorType.WALLET_EXTENSION:
				console.log(
					'Wallet extension not available - preserving data for when extension is available'
				);
				connectedWallet.set(null);
				user.set(null);
				provider.set(null);
				walletError.set(
					'Wallet extension not available. Please check if your wallet is installed and enabled.'
				);
				break;

			case ErrorType.INVALID_STATE:
				console.log('Invalid stored data - clearing all data');
				connectedWallet.set(null);
				user.set(null);
				provider.set(null);
				removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
				removeFromStorage(STORAGE_KEYS.USER_DATA);
				walletError.set('Stored wallet data is corrupted. Please reconnect manually.');
				break;

			case ErrorType.NETWORK:
			case ErrorType.UNKNOWN:
			default:
				console.log('Network or unknown error - preserving data for retry');
				connectedWallet.set(null);
				user.set(null);
				provider.set(null);
				walletError.set('Unable to reconnect. Please check your connection and try again.');
				break;
		}
	} finally {
		isLoading.set(false);
	}
};

// Backward compatibility wrapper - updates user store with assigned role
export const updateUserRoleFromBlockchain = async (autoAssignConsumer: boolean = true) => {
	const currentUser = get(user);
	if (!currentUser) return null;

	const strategy = autoAssignConsumer
		? RoleAssignmentStrategy.MANUAL_RETURNING
		: RoleAssignmentStrategy.ACCOUNT_SWITCH;

	const assignedRole = await assignUserRole(strategy, currentUser.address, currentUser.role);

	if (assignedRole !== null) {
		user.update((u) => (u ? { ...u, role: assignedRole } : u));
	}

	return assignedRole;
};

// Function to change user role
export const setUserRole = (role: User['role']) => {
	user.update((currentUser) => {
		if (currentUser) {
			return { ...currentUser, role };
		}
		return currentUser;
	});
};
