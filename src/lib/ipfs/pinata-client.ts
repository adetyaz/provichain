// Pinata IPFS service module
import { CONFIG } from '$lib/config/environment';
import type { ProductMetadata } from '$lib/types';

// Upload metadata to Pinata IPFS
export async function uploadMetadataToPinata(
	metadata: ProductMetadata | Record<string, unknown>
): Promise<string> {
	try {
		// Determine metadata type and create appropriate pinata metadata
		let pinataMetadata: Record<string, unknown>;

		if ('productId' in metadata) {
			// ProductMetadata
			pinataMetadata = {
				name: `Product-${metadata.productId}-metadata.json`,
				keyvalues: {
					productId: metadata.productId,
					manufacturer: metadata.manufacturer,
					category: metadata.category
				}
			};
		} else if ('batchId' in metadata && 'totalQuantity' in metadata) {
			// BatchMetadata
			pinataMetadata = {
				name: `Batch-${metadata.batchId}-metadata.json`,
				keyvalues: {
					batchId: metadata.batchId,
					manufacturer: metadata.manufacturer,
					category: metadata.category,
					type: 'batch'
				}
			};
		} else if ('tokenId' in metadata) {
			// TokenMetadata
			pinataMetadata = {
				name: `Token-${metadata.tokenId}-metadata.json`,
				keyvalues: {
					tokenId: metadata.tokenId,
					batchId: metadata.batchId,
					manufacturer: metadata.manufacturer,
					category: metadata.category,
					type: 'token'
				}
			};
		} else {
			// Fallback
			pinataMetadata = {
				name: `Metadata-${Date.now()}.json`,
				keyvalues: {
					timestamp: new Date().toISOString()
				}
			};
		}

		const data = JSON.stringify({
			pinataContent: metadata,
			pinataMetadata: pinataMetadata
		});

		const response = await fetch(`${CONFIG.pinata.baseUrl}/pinning/pinJSONToIPFS`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				pinata_api_key: CONFIG.pinata.apiKey,
				pinata_secret_api_key: CONFIG.pinata.secretKey
			},
			body: data
		});

		if (!response.ok) {
			throw new Error(`Pinata upload failed: ${response.statusText}`);
		}

		const result = await response.json();
		return result.IpfsHash; // Returns the IPFS hash
	} catch (error) {
		console.error('Failed to upload to Pinata:', error);
		throw error;
	}
}

// Retrieve metadata from Pinata IPFS
export async function getMetadataFromPinata(ipfsHash: string): Promise<ProductMetadata> {
	try {
		const response = await fetch(`${CONFIG.pinata.gateway}${ipfsHash}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
		}

		const metadata = await response.json();
		return metadata as ProductMetadata;
	} catch (error) {
		console.error('Failed to retrieve from Pinata:', error);
		throw error;
	}
}

// Upload image to Pinata IPFS
export async function uploadImageToPinata(file: File): Promise<string> {
	try {
		const formData = new FormData();
		formData.append('file', file);

		const metadata = JSON.stringify({
			name: file.name,
			keyvalues: {
				type: 'product-image'
			}
		});
		formData.append('pinataMetadata', metadata);

		const response = await fetch(`${CONFIG.pinata.baseUrl}/pinning/pinFileToIPFS`, {
			method: 'POST',
			headers: {
				pinata_api_key: CONFIG.pinata.apiKey,
				pinata_secret_api_key: CONFIG.pinata.secretKey
			},
			body: formData
		});

		if (!response.ok) {
			throw new Error(`Image upload failed: ${response.statusText}`);
		}

		const result = await response.json();
		return result.IpfsHash;
	} catch (error) {
		console.error('Failed to upload image to Pinata:', error);
		throw error;
	}
}

// List all pinned files for a specific product
export async function listProductFiles(productId: string) {
	try {
		const response = await fetch(
			`${CONFIG.pinata.baseUrl}/data/pinList?metadata[keyvalues][productId]=${productId}`,
			{
				method: 'GET',
				headers: {
					pinata_api_key: CONFIG.pinata.apiKey,
					pinata_secret_api_key: CONFIG.pinata.secretKey
				}
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to list files: ${response.statusText}`);
		}

		const result = await response.json();
		return result.rows;
	} catch (error) {
		console.error('Failed to list product files:', error);
		throw error;
	}
}

// List all products by manufacturer wallet address
export async function listProductsByManufacturer(manufacturerAddress: string) {
	try {
		console.log('🔍 Querying Pinata for products from manufacturer:', manufacturerAddress);

		// Try a simpler approach first - get all files and filter client-side
		const url = `${CONFIG.pinata.baseUrl}/data/pinList?status=pinned&pageLimit=1000`;

		console.log('📡 Request URL:', url);

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				pinata_api_key: CONFIG.pinata.apiKey,
				pinata_secret_api_key: CONFIG.pinata.secretKey
			}
		});

		console.log('📡 Response status:', response.status, response.statusText);

		if (!response.ok) {
			// Log the error response for debugging
			const errorText = await response.text();
			console.error('❌ Pinata API error response:', errorText);
			throw new Error(
				`Failed to list manufacturer products: ${response.statusText} - ${errorText}`
			);
		}

		const result = await response.json();
		console.log('📋 Pinata query result - total files:', result.rows?.length || 0);

		// Filter files by manufacturer address and product type
		const manufacturerFiles =
			result.rows?.filter(
				(file: {
					ipfs_pin_hash: string;
					metadata: {
						name: string;
						keyvalues?: Record<string, unknown>;
					};
				}) => {
					// Check if this file has the manufacturer in its metadata
					const hasManufacturer = file.metadata?.keyvalues?.manufacturer === manufacturerAddress;
					const isProduct =
						file.metadata?.name?.startsWith('Product-') &&
						file.metadata?.name?.includes('-metadata.json');

					if (hasManufacturer && isProduct) {
						console.log('✅ Found matching product:', file.metadata.name);
					}

					return hasManufacturer && isProduct;
				}
			) || [];

		console.log(
			`📦 Found ${manufacturerFiles.length} product files for manufacturer ${manufacturerAddress}`
		);

		return manufacturerFiles;
	} catch (error) {
		console.error('Failed to list manufacturer products:', error);
		throw error;
	}
}
