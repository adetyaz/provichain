// Pinata IPFS service for metadata storage

// Use the actual credentials directly (in production, use proper env vars)
const PINATA_API_KEY = '8506b7009f5d327de610';
const PINATA_SECRET_KEY = '2ee092df00b03f2cbcf6bf58d833fd970555f6e883232ef1d8b2c958b1e330f7';
const PINATA_BASE_URL = 'https://api.pinata.cloud';

export interface ProductMetadata {
	description: string;
	category: string;
	timestamp: string;
	manufacturer: string;
	batch: string;
	productId: string;
	name: string;
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

// Upload metadata to Pinata IPFS
export async function uploadMetadataToPinata(metadata: ProductMetadata): Promise<string> {
	try {
		const data = JSON.stringify({
			pinataContent: metadata,
			pinataMetadata: {
				name: `Product-${metadata.productId}-metadata.json`,
				keyvalues: {
					productId: metadata.productId,
					manufacturer: metadata.manufacturer,
					category: metadata.category
				}
			}
		});

		const response = await fetch(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				pinata_api_key: PINATA_API_KEY,
				pinata_secret_api_key: PINATA_SECRET_KEY
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
		const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);

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

		const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
			method: 'POST',
			headers: {
				pinata_api_key: PINATA_API_KEY,
				pinata_secret_api_key: PINATA_SECRET_KEY
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
			`${PINATA_BASE_URL}/data/pinList?metadata[keyvalues][productId]=${productId}`,
			{
				method: 'GET',
				headers: {
					pinata_api_key: PINATA_API_KEY,
					pinata_secret_api_key: PINATA_SECRET_KEY
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
