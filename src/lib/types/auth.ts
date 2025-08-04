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

// Enhanced persisted store interface
export interface PersistedStore<T> {
	subscribe: (run: (value: T) => void) => () => void;
	set: (value: T) => void;
	update: (updater: (value: T) => T) => void;
	forceSync: () => void;
}

// Role assignment strategy for different connection scenarios
export enum RoleAssignmentStrategy {
	MANUAL_NEW = 'manual_new', // Manual connection - new account
	MANUAL_RETURNING = 'manual_returning', // Manual connection - returning account
	AUTO_RECONNECT = 'auto_reconnect', // Auto-reconnect on app load
	ACCOUNT_SWITCH = 'account_switch' // Account switched within session
}
