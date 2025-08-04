// Blockchain provider utilities for Massa Web3
import { getWallets, WalletName } from '@massalabs/wallet-provider';
import { SmartContract, Args } from '@massalabs/massa-web3';
import { CONFIG } from '$lib/config/environment';

// Browser-compatible account provider using wallet-provider
export async function getAccountProvider() {
	// Get available wallets in browser
	const walletList = await getWallets();

	if (walletList.length === 0) {
		throw new Error(
			'No compatible wallet found. Please install MassaStation or another Massa wallet.'
		);
	}

	// Try to find MassaStation wallet first
	let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);

	// If MassaStation not found, use first available wallet
	if (!wallet) {
		wallet = walletList[0];
	}

	// Get accounts from the wallet
	const accounts = await wallet.accounts();

	if (accounts.length === 0) {
		throw new Error('No accounts found in wallet. Please create an account first.');
	}

	// Return the first account as provider
	return accounts[0];
}

// Get user's web3 provider
export async function getWeb3Provider() {
	try {
		return await getAccountProvider();
	} catch (error) {
		console.error('Failed to get provider:', error);
		throw error;
	}
}

// Get user's current address
export async function getUserAddress(): Promise<string> {
	try {
		const provider = await getWeb3Provider();
		return provider.address;
	} catch (error) {
		console.error('Error getting user address:', error);
		return '';
	}
}

// Create smart contract instance
export function createSmartContract(contractAddress: string) {
	return async () => {
		const provider = await getWeb3Provider();
		return new SmartContract(provider, contractAddress);
	};
}

// Contract factory functions
export const getProductRegistryContract = createSmartContract(CONFIG.contracts.productRegistry);
export const getAccessControlContract = createSmartContract(CONFIG.contracts.accessControl);
export const getParticipantRegistryContract = createSmartContract(
	CONFIG.contracts.participantRegistry
);
export const getDIDRegistryContract = createSmartContract(CONFIG.contracts.didRegistry);

// Test contract connection and initialization
export async function testContractConnection() {
	try {
		const provider = await getWeb3Provider();
		const productRegistry = await getProductRegistryContract();

		console.log('🔍 Testing ProductRegistry contract connection...');
		console.log('Contract address:', CONFIG.contracts.productRegistry);
		console.log('Provider address:', provider.address);

		// Try to read a simple value from the contract
		try {
			const result = await productRegistry.read(
				'getProduct',
				new Args().addString('test-nonexistent-id').serialize()
			);
			console.log('✅ Contract is responding. Result:', new TextDecoder().decode(result.value));
			return { success: true, message: 'Contract is accessible' };
		} catch (readError) {
			console.log('❌ Contract read failed:', readError);
			// If it's a "data entry not found" error, that might mean the contract exists but the storage key doesn't
			const errorMessage = readError instanceof Error ? readError.message : String(readError);
			if (errorMessage.includes('data entry not found')) {
				console.log(
					'⚠️ Contract exists but storage key not found (this is expected for non-existent product)'
				);
				return {
					success: true,
					message: 'Contract exists but storage entry not found (normal for test)'
				};
			}
			return { success: false, error: 'Contract not responding to read calls: ' + errorMessage };
		}
	} catch (error) {
		console.error('❌ Contract connection test failed:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}
