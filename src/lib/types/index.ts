// Product interface for type safety
export interface Product {
	id: string;
	name: string;
	batch: string;
	quantity: number;
	category: string;
	description: string;
	status: 'Active' | 'Sold' | 'Transferred';
	mintedAt: string;
	manufacturer: string;
	ipfsHash: string;
	updatedAt?: string;
	image?: string;
	price?: number;
	specifications?: Record<string, string>;
}

// Batch record interface for batch-level data
export interface BatchRecord {
	batchId: string;
	name: string;
	description: string;
	category: string;
	totalQuantity: number;
	manufacturer: string;
	createdAt: string;
	ipfsHash: string;
	status: 'Active' | 'Completed' | 'Cancelled';
}

// Individual product token interface for NFT tokens
export interface ProductToken {
	tokenId: string;
	batchId: string;
	serialNumber: number; // 1, 2, 3, etc.
	name: string;
	status: 'Active' | 'Sold' | 'Transferred';
	owner: string;
	mintedAt: string;
	ipfsHash: string;
}

// Batch metadata for IPFS storage
export interface BatchMetadata {
	batchId: string;
	name: string;
	description: string;
	category: string;
	totalQuantity: number;
	manufacturer: string;
	timestamp: string;
	image?: string;
	attributes?: Array<{
		trait_type: string;
		value: string;
	}>;
	ascConfig?: {
		enableQualityMonitoring: boolean;
		temperatureThreshold: string;
		humidityThreshold: string;
		enablePaymentAutomation: boolean;
		paymentConditions: string;
		enableInsurance: boolean;
		insuranceValue: string;
	};
}

// Individual token metadata for IPFS storage
export interface TokenMetadata {
	tokenId: string;
	batchId: string;
	serialNumber: number;
	totalInBatch: number;
	name: string;
	description: string;
	category: string;
	manufacturer: string;
	timestamp: string;
	image?: string;
	attributes?: Array<{
		trait_type: string;
		value: string;
	}>;
}

// Product metadata for IPFS storage
export interface ProductMetadata {
	productId: string;
	name: string;
	batch: string;
	quantity: number;
	description: string;
	category: string;
	timestamp: string;
	manufacturer: string;
	image?: string;
	price?: number;
	specifications?: Record<string, string>;
	attributes?: Array<{
		trait_type: string;
		value: string;
	}>;
	ascConfig?: {
		enableQualityMonitoring: boolean;
		temperatureThreshold: string;
		humidityThreshold: string;
		enablePaymentAutomation: boolean;
		paymentConditions: string;
		enableInsurance: boolean;
		insuranceValue: string;
	};
}
