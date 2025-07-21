import { writable, derived } from 'svelte/store';
import { getWallets, WalletName } from '@massalabs/wallet-provider';
import type { Provider } from '@massalabs/massa-web3';

export interface User {
	address: string;
	did: string;
	role: 'manufacturer' | 'logistics' | 'consumer' | 'admin' | null;
	name?: string;
	avatar?: string;
}

// Core wallet state
export const provider = writable<Provider | null>(null);
export const connectedWallet = writable<string | null>(null);
export const user = writable<User | null>(null);
export const isLoading = writable<boolean>(false);
export const walletError = writable<string | null>(null);

// Derived state
export const isConnected = derived(
	[provider, connectedWallet],
	([$provider, $connectedWallet]) => !!$provider && !!$connectedWallet
);

// Wallet connection function
export const connectWallet = async () => {
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

		// Use the first account as provider
		const walletProvider = accounts[0];
		const address = walletProvider.address;

		console.log('🔗 Connected to address:', address);

		// Create user object with the connected address
		const newUser: User = {
			address,
			did: `did:massa:${address}`,
			role: 'consumer', // Default role, can be changed later
			name: `User ${address.slice(0, 8)}...`,
			avatar: undefined
		};

		// Update stores
		provider.set(walletProvider);
		connectedWallet.set(address);
		user.set(newUser);

		console.log('🎉 Wallet connected successfully!');
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

// Disconnect wallet function
export const disconnectWallet = () => {
	console.log('👋 Disconnecting wallet...');

	provider.set(null);
	connectedWallet.set(null);
	user.set(null);
	walletError.set(null);

	console.log('✅ Wallet disconnected');
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

// Function to change user role
export const setUserRole = (role: User['role']) => {
	user.update((currentUser) => {
		if (currentUser) {
			return { ...currentUser, role };
		}
		return currentUser;
	});
};
