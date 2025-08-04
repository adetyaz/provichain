import type { User, WalletInfo } from '../types/auth';

// Enhanced data validation for localStorage with comprehensive integrity checks
export const validateStoredWalletInfo = (data: unknown): WalletInfo | null => {
	if (!data || typeof data !== 'object') return null;

	const wallet = data as Record<string, unknown>;

	// Type validation
	if (
		typeof wallet.address !== 'string' ||
		typeof wallet.accountIndex !== 'number' ||
		typeof wallet.name !== 'string' ||
		typeof wallet.shortAddress !== 'string'
	) {
		return null;
	}

	// Content validation
	if (
		wallet.address.length === 0 ||
		wallet.accountIndex < 0 ||
		wallet.name.length === 0 ||
		wallet.shortAddress.length === 0
	) {
		return null;
	}

	// Format validation - basic Massa address format check
	if (!wallet.address.startsWith('AU') || wallet.address.length < 20) {
		return null;
	}

	// Short address format validation
	const expectedShortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
	if (wallet.shortAddress !== expectedShortAddress) {
		// Auto-fix short address if main address is valid
		wallet.shortAddress = expectedShortAddress;
	}

	return wallet as unknown as WalletInfo;
};

export const validateStoredUser = (data: unknown): User | null => {
	if (!data || typeof data !== 'object') return null;

	const user = data as Record<string, unknown>;

	// Type validation
	if (
		typeof user.address !== 'string' ||
		typeof user.did !== 'string' ||
		(user.role !== null && typeof user.role !== 'string')
	) {
		return null;
	}

	// Content validation
	if (user.address.length === 0 || user.did.length === 0) {
		return null;
	}

	// Format validation - basic Massa address format check
	if (!user.address.startsWith('AU') || user.address.length < 20) {
		return null;
	}

	// DID format validation
	const expectedDid = `did:massa:${user.address}`;
	if (user.did !== expectedDid) {
		// Auto-fix DID if address is valid
		user.did = expectedDid;
	}

	// Role validation
	const validRoles = ['manufacturer', 'logistics', 'consumer', 'admin'];
	if (user.role !== null && !validRoles.includes(user.role as string)) {
		// Invalid role - reset to null for re-assignment
		user.role = null;
	}

	// Optional field validation
	if (user.name !== undefined && typeof user.name !== 'string') {
		user.name = `User ${user.address.slice(0, 8)}...`;
	}

	if (user.avatar !== undefined && typeof user.avatar !== 'string') {
		user.avatar = undefined;
	}

	return user as unknown as User;
};
