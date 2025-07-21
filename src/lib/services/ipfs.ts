// IPFS Service Configuration
const IPFS_CONFIG = {
	pinata: {
		apiKey: import.meta.env.VITE_PINATA_API_KEY,
		secretApiKey: import.meta.env.VITE_PINATA_SECRET_API_KEY
	},
	nftStorage: {
		token: import.meta.env.VITE_NFT_STORAGE_API_TOKEN
	}
};

interface IPFSUploadResult {
	hash: string;
	url: string;
	size: number;
}

interface ProductDocMetadata {
	productId: string;
	type: string;
	[key: string]: string;
}

interface IPFSFileReference {
	name: string;
	hash: string;
	url: string;
	size: number;
}

interface ProductDocBundle extends Record<string, unknown> {
	productId: string;
	timestamp: string;
	specifications: Record<string, unknown>;
	images: IPFSFileReference[];
	certifications: IPFSFileReference[];
}

class IPFSService {
	private pinataApiKey: string | undefined;
	private pinataSecretKey: string | undefined;

	constructor() {
		this.pinataApiKey = IPFS_CONFIG.pinata.apiKey;
		this.pinataSecretKey = IPFS_CONFIG.pinata.secretApiKey;
	}

	/**
	 * Upload file to IPFS via Pinata API
	 */
	async uploadFile(file: File, metadata?: ProductDocMetadata): Promise<IPFSUploadResult> {
		try {
			if (!this.pinataApiKey || !this.pinataSecretKey) {
				throw new Error('Pinata not configured');
			}

			const formData = new FormData();
			formData.append('file', file);

			if (metadata) {
				formData.append(
					'pinataMetadata',
					JSON.stringify({
						name: metadata.name || file.name,
						keyvalues: metadata
					})
				);
			}

			const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
				method: 'POST',
				headers: {
					pinata_api_key: this.pinataApiKey,
					pinata_secret_api_key: this.pinataSecretKey
				},
				body: formData
			});

			const result = await response.json();

			return {
				hash: result.IpfsHash,
				url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
				size: result.PinSize
			};
		} catch (error) {
			console.error('IPFS upload failed:', error);
			throw error;
		}
	}

	/**
	 * Upload JSON data to IPFS
	 */
	async uploadJSON(data: Record<string, unknown>, name?: string): Promise<IPFSUploadResult> {
		try {
			if (!this.pinataApiKey || !this.pinataSecretKey) {
				throw new Error('Pinata not configured');
			}

			const body = {
				pinataContent: data,
				pinataMetadata: name ? { name } : undefined
			};

			const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					pinata_api_key: this.pinataApiKey,
					pinata_secret_api_key: this.pinataSecretKey
				},
				body: JSON.stringify(body)
			});

			const result = await response.json();

			return {
				hash: result.IpfsHash,
				url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
				size: result.PinSize
			};
		} catch (error) {
			console.error('IPFS JSON upload failed:', error);
			throw error;
		}
	}

	/**
	 * Retrieve file from IPFS
	 */
	async getFile(hash: string): Promise<Response> {
		const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
		return fetch(url);
	}

	/**
	 * Retrieve JSON data from IPFS
	 */
	async getJSON(hash: string): Promise<Record<string, unknown>> {
		const response = await this.getFile(hash);
		return response.json();
	}

	/**
	 * Upload product documentation bundle
	 */
	async uploadProductDocs(
		docs: {
			images: File[];
			certifications: File[];
			specifications: Record<string, unknown>;
		},
		productId: string
	): Promise<string> {
		// Create documentation bundle
		const bundle: ProductDocBundle = {
			productId,
			timestamp: new Date().toISOString(),
			specifications: docs.specifications,
			images: [],
			certifications: []
		};

		// Upload images
		for (const image of docs.images) {
			const result = await this.uploadFile(image, {
				productId,
				type: 'image'
			});
			bundle.images.push({
				name: image.name,
				hash: result.hash,
				url: result.url,
				size: result.size
			});
		}

		// Upload certifications
		for (const cert of docs.certifications) {
			const result = await this.uploadFile(cert, {
				productId,
				type: 'certification'
			});
			bundle.certifications.push({
				name: cert.name,
				hash: result.hash,
				url: result.url,
				size: result.size
			});
		}

		// Upload the complete bundle
		const bundleResult = await this.uploadJSON(bundle, `product-${productId}-docs`);
		return bundleResult.hash;
	}
}

export const ipfsService = new IPFSService();
export type { IPFSUploadResult, ProductDocMetadata, IPFSFileReference, ProductDocBundle };
