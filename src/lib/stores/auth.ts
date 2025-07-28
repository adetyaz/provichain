import { writable, derived, get } from 'svelte/store';
import { getWallets, WalletName } from '@massalabs/wallet-provider';
import type { Provider } from '@massalabs/massa-web3';
import { browser } from '$app/environment';

export interface User {
	address: string;
	did: string;
	role: 'manufacturer' | 'logistics' | 'consumer' | 'admin' | null;
	name?: string;
	avatar?: string;
}

export interface WalletInfo {
	address: string;
	accountIndex: number;
	name: string;
	shortAddress: string;
}

// Storage keys
const STORAGE_KEYS = {
	CONNECTED_WALLET: 'provichain_connected_wallet',
	USER_DATA: 'provichain_user_data',
	MANUAL_DISCONNECT: 'provichain_manual_disconnect'
};

// Helper functions for localStorage
const saveToStorage = (key: string, value: unknown) => {
	if (browser) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.warn('Failed to save to localStorage:', error);
		}
	}
};

const loadFromStorage = (key: string) => {
	if (browser) {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (error) {
			console.warn('Failed to load from localStorage:', error);
			return null;
		}
	}
	return null;
};

const removeFromStorage = (key: string) => {
	if (browser) {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.warn('Failed to remove from localStorage:', error);
		}
	}
};

// Helper to check if user manually disconnected
export const isManuallyDisconnected = (): boolean => {
	const manualDisconnect = loadFromStorage(STORAGE_KEYS.MANUAL_DISCONNECT);
	console.log('🔍 Checking manual disconnect flag:', manualDisconnect);
	return manualDisconnect === true;
};

// Initialize stores with persisted data
const createPersistedStore = <T>(key: string, initialValue: T) => {
	const stored = loadFromStorage(key);
	const { subscribe, set, update } = writable<T>(stored ?? initialValue);

	return {
		subscribe,
		set: (value: T) => {
			set(value);
			if (value === null || value === undefined) {
				removeFromStorage(key);
			} else {
				saveToStorage(key, value);
			}
		},
		update: (updater: (value: T) => T) => {
			update((current) => {
				const newValue = updater(current);
				if (newValue === null || newValue === undefined) {
					removeFromStorage(key);
				} else {
					saveToStorage(key, newValue);
				}
				return newValue;
			});
		}
	};
};

// Global wallet listener for account changes
let walletListener: { unsubscribe: () => void } | null = null;

// Function to setup wallet account change listener
const setupAccountChangeListener = async () => {
	try {
		const walletList = await getWallets();
		if (walletList.length === 0) return;

		// Get the first available wallet
		const wallet = walletList[0];

		// Remove existing listener if any
		if (walletListener) {
			walletListener.unsubscribe();
			walletListener = null;
		}

		// Setup new listener for account changes
		const listener = wallet.listenAccountChanges?.(async (newAddress: string) => {
			console.log('🔄 Wallet account changed to:', newAddress);

			// Get current connected wallet
			const currentWallet = get(connectedWallet);

			// Only update if this is a different address AND it's not during a transaction
			if (currentWallet && currentWallet.address !== newAddress) {
				console.log('🔄 Account change detected:', currentWallet.address, '->', newAddress);

				// Add a small delay to avoid conflicts during transaction signing
				setTimeout(async () => {
					try {
						// Double check the account is still different (transaction might have completed)
						const stillCurrentWallet = get(connectedWallet);
						if (!stillCurrentWallet || stillCurrentWallet.address === newAddress) {
							console.log('📍 Account change already handled or reverted');
							return;
						}

						console.log('🔄 Proceeding with account switch to:', newAddress);

						// Get the new account provider
						const accounts = await wallet.accounts();
						if (accounts.length > 0 && accounts[0].address === newAddress) {
							const newProvider = accounts[0];

							// Create new user and wallet info
							const newUser: User = {
								address: newAddress,
								did: `did:massa:${newAddress}`,
								role: null, // Reset role for new account - user must request roles again
								name: `User ${newAddress.slice(0, 8)}...`,
								avatar: undefined
							};

							const newWalletInfo: WalletInfo = {
								address: newAddress,
								accountIndex: 0,
								name: 'Active Account',
								shortAddress: `${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`
							};

							// Update stores
							provider.set(newProvider);
							connectedWallet.set(newWalletInfo);
							user.set(newUser);

							console.log('✅ Successfully switched to account:', newAddress);

							// Check roles for the new account after a longer delay
							setTimeout(() => {
								updateUserRoleFromBlockchain(false); // Don't auto-assign consumer for account switches
							}, 2000);
						}
					} catch (error) {
						console.error('❌ Error during account switch:', error);
					}
				}, 1500); // Wait 1.5 seconds before processing account change
			}
		});

		if (listener) {
			walletListener = listener;
			console.log('👂 Account change listener setup successfully');
		}
	} catch (error) {
		console.error('❌ Failed to setup account change listener:', error);
	}
};

// Cleanup wallet listener
export const cleanupAccountChangeListener = () => {
	if (walletListener) {
		walletListener.unsubscribe();
		walletListener = null;
		console.log('🧹 Wallet account change listener cleaned up');
	}
};

// Core wallet state with persistence
export const provider = writable<Provider | null>(null);
export const connectedWallet = createPersistedStore<WalletInfo | null>(
	STORAGE_KEYS.CONNECTED_WALLET,
	null
);
export const user = createPersistedStore<User | null>(STORAGE_KEYS.USER_DATA, null);
export const isLoading = writable<boolean>(false);
export const walletError = writable<string | null>(null);

// Derived state
export const isConnected = derived(
	[provider, connectedWallet],
	([$provider, $connectedWallet]) => !!$provider && !!$connectedWallet
);

// Helper to get current wallet address
export const currentWalletAddress = derived(
	connectedWallet,
	($connectedWallet) => $connectedWallet?.address || null
);

// Wallet connection function
export const connectWallet = async (selectedAccountIndex?: number) => {
	try {
		isLoading.set(true);
		walletError.set(null);

		console.log('🔍 Searching for available wallets...');

		// Get all available wallets
		const walletList = await getWallets();
		console.log(
			'📱 Found wallets:',
			walletList.map((w) => w.name())
		);

		// Try to find MassaStation wallet first
		let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);

		// If MassaStation not found, try other wallets
		if (!wallet && walletList.length > 0) {
			wallet = walletList[0]; // Use first available wallet
			console.log('⚠️ MassaStation not found, using:', wallet.name());
		}

		if (!wallet) {
			throw new Error(
				'No compatible wallet found. Please install MassaStation or another Massa wallet.'
			);
		}

		console.log('✅ Using wallet:', wallet.name());

		// Get accounts from the wallet
		const accounts = await wallet.accounts();
		console.log('👥 Found accounts:', accounts.length);

		if (accounts.length === 0) {
			throw new Error('No accounts found in wallet. Please create an account first.');
		}

		// Use the specified account index, or default to 0
		const accountIndex = selectedAccountIndex !== undefined ? selectedAccountIndex : 0;

		if (accountIndex >= accounts.length) {
			throw new Error(
				`Account index ${accountIndex} not available. Only ${accounts.length} accounts found.`
			);
		}

		const walletProvider = accounts[accountIndex];
		const address = walletProvider.address;

		console.log('🔗 Connecting to account:', address, 'at index:', accountIndex);

		// Check if this is a different account than what was previously stored
		const previousWallet = get(connectedWallet);
		const isNewAccount = !previousWallet || previousWallet.address !== address;

		// Create user object with the connected address
		const newUser: User = {
			address,
			did: `did:massa:${address}`,
			role: isNewAccount ? 'consumer' : null, // New accounts default to consumer, returning accounts check blockchain
			name: `User ${address.slice(0, 8)}...`,
			avatar: undefined
		};

		// Create wallet info object with account details
		const walletInfo: WalletInfo = {
			address,
			accountIndex, // Use the actual selected account index
			name: `Account ${accountIndex}`,
			shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
		};

		// Update stores - this will automatically persist to localStorage
		provider.set(walletProvider);
		connectedWallet.set(walletInfo);
		user.set(newUser);

		// Clear manual disconnect flag since user is actively connecting
		// This allows auto-reconnect to work again for this session
		removeFromStorage(STORAGE_KEYS.MANUAL_DISCONNECT);
		console.log('🔓 Manual disconnect flag cleared - auto-reconnect enabled');

		console.log('🎉 Wallet connected successfully to:', address);

		// Setup account change listener to automatically detect wallet account switches
		await setupAccountChangeListener();

		// Only check for existing roles if this is the same account reconnecting
		// For new accounts, user must explicitly request roles via the UI
		if (!isNewAccount) {
			console.log('🔍 Checking existing roles for returning account...');
			setTimeout(() => {
				updateUserRoleFromBlockchain(true); // Auto-assign consumer for returning users
			}, 1000);
		} else {
			console.log('👤 New account connected - roles must be explicitly requested via UI');
		}
	} catch (error) {
		console.error('❌ Wallet connection failed:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		walletError.set(errorMessage);

		// Reset state on error
		provider.set(null);
		connectedWallet.set(null);
		user.set(null);

		throw error;
	} finally {
		isLoading.set(false);
	}
};

// Switch wallet function - disconnects current wallet and connects new one
export const switchWallet = async () => {
	try {
		console.log('🔄 Switching wallet...');

		// First, clear current wallet state without marking as manual disconnect
		if (get(isConnected)) {
			// Clear stores without setting manual disconnect flag
			provider.set(null);
			connectedWallet.set(null);
			user.set(null);
			walletError.set(null);
			// Wait a bit to ensure disconnection is complete
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Then connect to new wallet
		await connectWallet();
	} catch (error) {
		console.error('❌ Wallet switch failed:', error);
		throw error;
	}
};

// Disconnect wallet function
export const disconnectWallet = () => {
	console.log('👋 Disconnecting wallet...');

	// Cleanup account change listener
	cleanupAccountChangeListener();

	// Mark as manually disconnected to prevent auto-reconnect
	saveToStorage(STORAGE_KEYS.MANUAL_DISCONNECT, true);
	console.log('🔒 Manual disconnect flag set to:', true);

	// Clear all stores
	provider.set(null);
	connectedWallet.set(null);
	user.set(null);
	walletError.set(null);

	// Also manually clear localStorage to ensure complete cleanup
	removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
	removeFromStorage(STORAGE_KEYS.USER_DATA);

	console.log('✅ Wallet disconnected and all data cleared');
};

// Force disconnect and clear all persisted data
export const forceDisconnectWallet = () => {
	console.log('🔄 Force disconnecting and clearing all stored data...');

	// Cleanup account change listener
	cleanupAccountChangeListener();

	// Mark as manually disconnected to prevent auto-reconnect
	saveToStorage(STORAGE_KEYS.MANUAL_DISCONNECT, true);

	// Clear all stores (this will also clear localStorage due to persisted stores)
	provider.set(null);
	connectedWallet.set(null);
	user.set(null);
	walletError.set(null);

	// Also manually clear localStorage as an extra precaution
	removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
	removeFromStorage(STORAGE_KEYS.USER_DATA);

	// Clear ALL localStorage keys related to our app
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

	console.log('✅ Wallet force disconnected and ALL data cleared');
};

// Reset wallet state completely - useful when switching to a different wallet entirely
export const resetWalletState = () => {
	console.log('🔄 Resetting wallet state completely...');

	// Clear all stores
	provider.set(null);
	connectedWallet.set(null);
	user.set(null);
	walletError.set(null);
	isLoading.set(false);

	// Clear ALL localStorage keys related to our app
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

	console.log('✅ Wallet state completely reset');
};

// Auto-reconnect function to restore wallet connection on page load
export const autoReconnectWallet = async () => {
	// Skip if not in browser or if already connected/connecting
	if (!browser || get(provider) || get(isLoading)) {
		return;
	}

	// Check if user manually disconnected - if so, don't auto-reconnect
	const manuallyDisconnected = loadFromStorage(STORAGE_KEYS.MANUAL_DISCONNECT);
	if (manuallyDisconnected) {
		console.log('⏸️ Skipping auto-reconnect - user manually disconnected');
		// Do NOT clear the manual disconnect flag - keep it so auto-reconnect stays disabled
		// Clear stored wallet data since we're not reconnecting
		connectedWallet.set(null);
		user.set(null);
		removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
		removeFromStorage(STORAGE_KEYS.USER_DATA);
		return;
	}

	try {
		isLoading.set(true);
		walletError.set(null);

		console.log('🔄 Attempting to auto-reconnect wallet...');

		// Get available wallets
		const walletList = await getWallets();

		if (walletList.length === 0) {
			console.log('⚠️ No wallets available for reconnection');
			// Clear stored data if no wallets available
			connectedWallet.set(null);
			user.set(null);
			removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
			removeFromStorage(STORAGE_KEYS.USER_DATA);
			return;
		}

		// Try to find the same wallet type or use first available
		let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);
		if (!wallet) {
			wallet = walletList[0];
		}

		// Get accounts from the wallet
		const accounts = await wallet.accounts();

		if (accounts.length === 0) {
			console.log('⚠️ No accounts found in wallet');
			connectedWallet.set(null);
			user.set(null);
			removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
			removeFromStorage(STORAGE_KEYS.USER_DATA);
			return;
		}

		// Get stored wallet info to determine which account to reconnect to
		const storedWalletInfo = get(connectedWallet);
		const storedUser = get(user);

		// If no stored wallet info, don't auto-reconnect (user needs to manually connect)
		if (!storedWalletInfo || !storedWalletInfo.address) {
			console.log('⚠️ No stored wallet info found - skipping auto-reconnect');
			connectedWallet.set(null);
			user.set(null);
			removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
			removeFromStorage(STORAGE_KEYS.USER_DATA);
			return;
		}

		// Find the specific account that was previously connected
		const targetAccount = accounts.find((account) => account.address === storedWalletInfo.address);

		if (!targetAccount) {
			console.log('⚠️ Previously connected account not found in wallet - skipping auto-reconnect');
			// Clear stored data since the account is no longer available
			connectedWallet.set(null);
			user.set(null);
			removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
			removeFromStorage(STORAGE_KEYS.USER_DATA);
			return;
		}

		const currentAddress = targetAccount.address;
		console.log('🔗 Auto-reconnecting to previously connected account:', currentAddress);
		const isSameAccount = true; // We specifically found the same account

		// Create user object
		const newUser: User = {
			address: currentAddress,
			did: `did:massa:${currentAddress}`,
			role: isSameAccount && storedUser?.role ? storedUser.role : null, // Keep role if same account
			name: `User ${currentAddress.slice(0, 8)}...`,
			avatar: undefined
		};

		// Create wallet info object
		const walletInfo: WalletInfo = {
			address: currentAddress,
			accountIndex: 0, // Always use index 0 (currently active account)
			name: 'Account 1',
			shortAddress: `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`
		};

		// Update stores
		provider.set(targetAccount);
		connectedWallet.set(walletInfo);
		user.set(newUser);

		console.log('✅ Auto-reconnect successful to:', currentAddress);

		// Only check roles if this is the same account that was previously connected
		if (isSameAccount && storedUser?.role) {
			console.log('🔍 Same account reconnected, verifying existing role...');
			setTimeout(() => {
				updateUserRoleFromBlockchain(true); // Auto-assign consumer for returning users
			}, 1000);
		} else if (isSameAccount) {
			console.log('🔍 Same account but no stored role, checking blockchain...');
			setTimeout(() => {
				updateUserRoleFromBlockchain(true); // Auto-assign consumer for returning users
			}, 1000);
		} else {
			console.log('👤 Different account detected, roles must be explicitly requested');
		}
	} catch (error) {
		console.error('❌ Auto-reconnect failed:', error);
		// Clear stored data on reconnection failure
		connectedWallet.set(null);
		user.set(null);
		provider.set(null);
		removeFromStorage(STORAGE_KEYS.CONNECTED_WALLET);
		removeFromStorage(STORAGE_KEYS.USER_DATA);
	} finally {
		isLoading.set(false);
	}
};

// Function to get available wallet accounts for selection
export const getWalletAccounts = async () => {
	try {
		console.log('🔍 Getting wallet accounts for selection...');

		const walletList = await getWallets();
		if (walletList.length === 0) {
			return { success: false, error: 'No wallets found' };
		}

		// Try to find MassaStation wallet first
		let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);
		if (!wallet) {
			wallet = walletList[0];
		}

		console.log('📱 Using wallet for account list:', wallet.name());
		const accounts = await wallet.accounts();

		console.log('📋 Raw accounts from wallet:');
		accounts.forEach((account, index) => {
			console.log(`  ${index}: ${account.address} (${typeof account})`);
		});

		// Note: Most Massa wallets only return the currently active account
		// To switch accounts, users must change the active account in their wallet UI
		const accountData = accounts.map((account, index) => ({
			index,
			address: account.address,
			name: index === 0 ? 'Currently Active Account' : `Account ${index + 1}`,
			shortAddress: `${account.address.slice(0, 8)}...${account.address.slice(-6)}`
		}));

		console.log('📊 Processed account data:', accountData);
		console.log('ℹ️ Note: To switch accounts, change the active account in your wallet extension');

		return {
			success: true,
			data: accountData
		};
	} catch (error) {
		console.error('Failed to get wallet accounts:', error);
		return { success: false, error: 'Failed to get wallet accounts' };
	}
};

// Function to check if wallet is available
export const checkWalletAvailability = async (): Promise<boolean> => {
	try {
		const walletList = await getWallets();
		return walletList.length > 0;
	} catch (error) {
		console.error('Error checking wallet availability:', error);
		return false;
	}
};

// Function to check and update user role from blockchain
export const updateUserRoleFromBlockchain = async (autoAssignConsumer: boolean = true) => {
	try {
		const currentUser = get(user);
		if (!currentUser) return;

		// Import here to avoid circular dependency
		const { checkUserRole } = await import('../web3');

		// Check roles in priority order - using uppercase names for contract
		const rolesToCheck = [
			{ contract: 'ADMIN', store: 'admin' },
			{ contract: 'MANUFACTURER', store: 'manufacturer' },
			{ contract: 'LOGISTICS', store: 'logistics' },
			{ contract: 'CONSUMER', store: 'consumer' }
		];

		for (const { contract: roleToCheck, store: storeRole } of rolesToCheck) {
			const hasRole = await checkUserRole(roleToCheck);
			if (hasRole) {
				user.update((u) => (u ? { ...u, role: storeRole as User['role'] } : u));
				console.log('✅ User role updated to:', storeRole);
				return storeRole;
			}
		}

		// Only assign default consumer role if explicitly requested (for returning users)
		if (autoAssignConsumer) {
			user.update((u) => (u ? { ...u, role: 'consumer' } : u));
			console.log('✅ No specific role found, assigned default consumer role');
			return 'consumer';
		} else {
			console.log('ℹ️ No blockchain roles found, keeping null role (user must request via UI)');
			return null;
		}
	} catch (error) {
		console.error('Error updating user role:', error);
		return null;
	}
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
