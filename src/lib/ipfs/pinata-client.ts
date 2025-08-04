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

// Upload image to Pinata IPFS with validation and progress support
export async function uploadImageToPinata(
	file: File,
	progressCallback?: (progress: number) => void,
	productId?: string,
	manufacturerAddress?: string
): Promise<string> {
	try {
		// File validation
		const maxSize = 10 * 1024 * 1024; // 10MB
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

		if (file.size > maxSize) {
			throw new Error('Image file size must be less than 10MB');
		}

		if (!allowedTypes.includes(file.type)) {
			throw new Error('Image must be JPEG, PNG, WebP, or GIF format');
		}

		console.log('📤 Uploading image to IPFS via Pinata...');
		console.log('Image details:', {
			name: file.name,
			size: file.size,
			type: file.type,
			productId
		});

		const formData = new FormData();
		formData.append('file', file);

		// Create enhanced metadata
		const keyvalues: Record<string, string> = {
			type: 'product-image',
			uploadedAt: new Date().toISOString(),
			fileSize: file.size.toString(),
			mimeType: file.type,
			originalName: file.name
		};

		if (productId) {
			keyvalues.productId = productId;
		}
		if (manufacturerAddress) {
			keyvalues.manufacturer = manufacturerAddress;
		}

		const metadata = JSON.stringify({
			name: productId ? `Product-${productId}-image.${file.name.split('.').pop()}` : file.name,
			keyvalues
		});
		formData.append('pinataMetadata', metadata);

		// Add Pinata options
		const pinataOptions = JSON.stringify({
			cidVersion: 0
		});
		formData.append('pinataOptions', pinataOptions);

		// Create XMLHttpRequest for progress tracking
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();

			if (progressCallback) {
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						const progress = Math.round((event.loaded / event.total) * 100);
						progressCallback(progress);
					}
				};
			}

			xhr.onload = () => {
				console.log('📡 Response status:', xhr.status, xhr.statusText);

				if (xhr.status === 200) {
					try {
						const result = JSON.parse(xhr.responseText);
						console.log('✅ Image uploaded successfully to IPFS:', result.IpfsHash);
						resolve(result.IpfsHash);
					} catch (parseError) {
						console.error('❌ Failed to parse upload response:', parseError);
						reject(new Error('Failed to parse upload response'));
					}
				} else {
					console.error('❌ Image upload failed:', xhr.status, xhr.statusText);
					reject(new Error(`Image upload failed: ${xhr.statusText}`));
				}
			};

			xhr.onerror = () => {
				console.error('❌ Network error during image upload');
				reject(new Error('Network error during image upload'));
			};

			xhr.open('POST', `${CONFIG.pinata.baseUrl}/pinning/pinFileToIPFS`);
			xhr.setRequestHeader('pinata_api_key', CONFIG.pinata.apiKey);
			xhr.setRequestHeader('pinata_secret_api_key', CONFIG.pinata.secretKey);
			xhr.send(formData);
		});
	} catch (error) {
		console.error('❌ Failed to upload image to Pinata:', error);
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
