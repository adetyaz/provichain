import { getWallets, WalletName } from '@massalabs/wallet-provider';
import type { Provider } from '@massalabs/massa-web3';
import type { User } from '../types/auth';
import { RoleAssignmentStrategy } from '../types/auth';

// Validate wallet provider state and account availability
export const validateWalletProviderState = async (
	targetAddress: string,
	walletList: Awaited<ReturnType<typeof getWallets>>
): Promise<{
	wallet: Awaited<ReturnType<typeof getWallets>>[0];
	account: Provider;
	accountIndex: number;
} | null> => {
	if (walletList.length === 0) {
		console.log('No wallets available for validation');
		return null;
	}

	// Try to find MassaWallet first, fallback to first available
	let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);
	if (!wallet) {
		wallet = walletList[0];
		console.log('MassaWallet not found for validation, using:', wallet.name());
	}

	try {
		const accounts = await wallet.accounts();
		if (accounts.length === 0) {
			console.log('No accounts found in wallet during validation');
			return null;
		}

		const accountIndex = accounts.findIndex((acc) => acc.address === targetAddress);
		const account = accountIndex >= 0 ? accounts[accountIndex] : null;

		if (!account) {
			console.log(
				`Target address ${targetAddress} not found in wallet accounts:`,
				accounts.map((acc) => acc.address)
			);
			return null;
		}

		return { wallet, account, accountIndex };
	} catch (error) {
		console.error('Error validating wallet provider state:', error);
		return null;
	}
};

// Centralized role assignment logic
export const assignUserRole = async (
	strategy: RoleAssignmentStrategy,
	address: string,
	storedRole?: User['role']
): Promise<User['role']> => {
	console.log(`Assigning role for ${address} using strategy: ${strategy}`);

	try {
		// Import here to avoid circular dependency
		const { checkUserRole } = await import('../web3');

		// Check roles in priority order - using uppercase names for contract
		const rolesToCheck = [
			{ contract: 'ADMIN', store: 'admin' },
			{ contract: 'MANUFACTURER', store: 'manufacturer' },
			{ contract: 'LOGISTICS', store: 'logistics' },
			{ contract: 'CONSUMER', store: 'consumer' }
		];

		// First, always check blockchain for assigned roles
		for (const { contract: roleToCheck, store: storeRole } of rolesToCheck) {
			const hasRole = await checkUserRole(roleToCheck);
			if (hasRole) {
				console.log(`Found blockchain role: ${storeRole} for address: ${address}`);
				return storeRole as User['role'];
			}
		}

		// No blockchain role found - apply strategy-specific fallback
		switch (strategy) {
			case RoleAssignmentStrategy.MANUAL_NEW:
				// New accounts get consumer by default (they can request other roles via UI)
				console.log('New account - assigning default consumer role');
				return 'consumer';

			case RoleAssignmentStrategy.MANUAL_RETURNING:
				// Returning accounts without blockchain roles get consumer (they had it before)
				console.log('Returning account without blockchain role - assigning consumer');
				return 'consumer';

			case RoleAssignmentStrategy.AUTO_RECONNECT:
				// Auto-reconnect preserves stored role if valid, otherwise consumer
				if (storedRole && ['admin', 'manufacturer', 'logistics', 'consumer'].includes(storedRole)) {
					console.log(`Auto-reconnect preserving stored role: ${storedRole}`);
					return storedRole;
				}
				console.log('Auto-reconnect with invalid stored role - assigning consumer');
				return 'consumer';

			case RoleAssignmentStrategy.ACCOUNT_SWITCH:
				// Account switches require explicit role request via UI
				console.log('Account switch - user must request role via UI');
				return null;

			default:
				console.log('Unknown strategy - no role assigned');
				return null;
		}
	} catch (error) {
		console.error('Error during role assignment:', error);
		// Fallback based on strategy
		switch (strategy) {
			case RoleAssignmentStrategy.MANUAL_NEW:
			case RoleAssignmentStrategy.MANUAL_RETURNING:
				return 'consumer'; // Safe fallback for manual connections
			case RoleAssignmentStrategy.AUTO_RECONNECT:
				return storedRole || 'consumer'; // Preserve or fallback to consumer
			case RoleAssignmentStrategy.ACCOUNT_SWITCH:
			default:
				return null; // Require explicit role request
		}
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

// Function to get available wallet accounts for selection
export const getWalletAccounts = async () => {
	try {
		console.log('Getting wallet accounts for selection...');

		const walletList = await getWallets();
		if (walletList.length === 0) {
			return { success: false, error: 'No wallets found' };
		}

		// Try to find MassaStation wallet first
		let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);
		if (!wallet) {
			wallet = walletList[0];
		}

		console.log('Using wallet for account list:', wallet.name());
		const accounts = await wallet.accounts();

		console.log('Raw accounts from wallet:');
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

		console.log('Processed account data:', accountData);
		console.log('Note: To switch accounts, change the active account in your wallet extension');

		return {
			success: true,
			data: accountData
		};
	} catch (error) {
		console.error('Failed to get wallet accounts:', error);
		return { success: false, error: 'Failed to get wallet accounts' };
	}
};
