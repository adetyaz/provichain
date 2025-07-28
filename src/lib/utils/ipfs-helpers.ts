/**
 * IPFS Helper Functions for Provichain
 * Handles storage and retrieval of off-chain data via IPFS
 */

import { uploadMetadataToPinata, getMetadataFromPinata } from '$lib/ipfs/pinata-client';

// Extended metadata interfaces for IPFS storage
interface ShippingAddressMetadata {
	type: 'shipping-address';
	requestId: string;
	timestamp: string;
	shippingAddress: ShippingAddress;
}

interface RequestMetadata {
	type: 'product-request';
	requestId: string;
	productId: string;
	consumerId: string;
	quantity: number;
	urgency: 'low' | 'medium' | 'high';
	shippingAddressHash?: string;
	requestedAt: string;
}

export interface ShippingAddress {
	fullName: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	phoneNumber?: string;
}

/**
 * Store shipping address in IPFS and return hash
 */
export async function storeShippingAddressInIPFS(
	shippingAddress: ShippingAddress,
	requestId: string
): Promise<{ success: boolean; ipfsHash?: string; error?: string }> {
	try {
		console.log('📦 Storing shipping address in IPFS for request:', requestId);

		const metadata = {
			type: 'shipping-address',
			requestId,
			timestamp: new Date().toISOString(),
			shippingAddress
		};

		const ipfsHash = await uploadMetadataToPinata(metadata);

		if (ipfsHash) {
			console.log('✅ Shipping address stored in IPFS:', ipfsHash);
			return {
				success: true,
				ipfsHash: ipfsHash
			};
		} else {
			throw new Error('Failed to store in IPFS');
		}
	} catch (error) {
		console.error('❌ Failed to store shipping address in IPFS:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to store shipping address'
		};
	}
}

/**
 * Retrieve shipping address from IPFS using hash
 */
export async function getShippingAddressFromIPFS(
	ipfsHash: string
): Promise<{ success: boolean; shippingAddress?: ShippingAddress; error?: string }> {
	try {
		console.log('📥 Retrieving shipping address from IPFS:', ipfsHash);

		const metadata = (await getMetadataFromPinata(ipfsHash)) as unknown as ShippingAddressMetadata;

		if (metadata && metadata.type === 'shipping-address') {
			console.log('✅ Shipping address retrieved from IPFS');
			return {
				success: true,
				shippingAddress: metadata.shippingAddress
			};
		} else {
			throw new Error('Invalid shipping address metadata');
		}
	} catch (error) {
		console.error('❌ Failed to retrieve shipping address from IPFS:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to retrieve shipping address'
		};
	}
}

/**
 * Store request metadata in IPFS
 */
export async function storeRequestMetadataInIPFS(requestData: {
	requestId: string;
	productId: string;
	consumerId: string;
	manufacturerId: string;
	quantity: number;
	message?: string;
	timestamp: string;
}): Promise<{ success: boolean; ipfsHash?: string; error?: string }> {
	try {
		console.log('📝 Storing request metadata in IPFS for:', requestData.requestId);

		const metadata = {
			type: 'product-request',
			...requestData
		};

		const ipfsHash = await uploadMetadataToPinata(metadata);

		if (ipfsHash) {
			console.log('✅ Request metadata stored in IPFS:', ipfsHash);
			return {
				success: true,
				ipfsHash: ipfsHash
			};
		} else {
			throw new Error('Failed to store in IPFS');
		}
	} catch (error) {
		console.error('❌ Failed to store request metadata in IPFS:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to store request metadata'
		};
	}
}
