// Product service for managing product operations
import { Args, Mas } from '@massalabs/massa-web3';
import { getWeb3Provider, getProductRegistryContract } from '$lib/blockchain/provider';
import {
	uploadMetadataToPinata,
	getMetadataFromPinata,
	listProductsByManufacturer
} from '$lib/ipfs/pinata-client';
import { CONFIG } from '$lib/config/environment';
import type { Product, ProductMetadata } from '$lib/types';

// Get product by ID - searches across all available products
export async function getProductById(
	productId: string,
	manufacturerAddress?: string
): Promise<Product | null> {
	try {
		console.log('🔍 Searching for product:', productId);

		// If manufacturer address is provided, search their products first
		if (manufacturerAddress) {
			console.log('🏭 Searching specific manufacturer:', manufacturerAddress);
			const manufacturerProducts = await getManufacturerProducts(manufacturerAddress);
			const found = manufacturerProducts.find((p) => p.id === productId);
			if (found) {
				console.log('✅ Product found in manufacturer products');
				return found;
			}
		}

		// Fallback: Search current user's products (if they're a manufacturer)
		try {
			console.log('🔍 Searching current user products...');
			const currentUserProducts = await getManufacturerProducts();
			const found = currentUserProducts.find((p) => p.id === productId);
			if (found) {
				console.log('✅ Product found in current user products');
				return found;
			}
		} catch (err) {
			console.log('ℹ️ Could not search current user products (user may not be manufacturer)');
		}

		// TODO: In the future, implement global product search across all manufacturers
		// For now, return null if product not found in current scope
		console.log('❌ Product not found:', productId);
		return null;
	} catch (error) {
		console.error('Error getting product by ID:', error);
		return null;
	}
}

// Update product metadata on IPFS
export async function updateProductMetadata(
	productId: string,
	updatedProduct: Product
): Promise<boolean> {
	try {
		console.log('🔄 Updating product metadata for:', productId);

		// Create metadata object
		const metadata: ProductMetadata = {
			productId: updatedProduct.id,
			name: updatedProduct.name,
			batch: updatedProduct.batch || '',
			quantity: updatedProduct.quantity,
			description: updatedProduct.description || '',
			category: updatedProduct.category || '',
			timestamp: updatedProduct.updatedAt || new Date().toISOString(),
			manufacturer: updatedProduct.manufacturer,
			image: updatedProduct.image,
			price: updatedProduct.price,
			specifications: updatedProduct.specifications || {},
			attributes: []
		};

		// Upload updated metadata to Pinata
		const ipfsHash = await uploadMetadataToPinata(metadata);
		console.log('✅ Updated metadata uploaded to IPFS:', ipfsHash);

		// Update local storage with new data
		const storageKey = `manufacturer-products-${updatedProduct.manufacturer}`;
		const existingData = localStorage.getItem(storageKey);

		if (existingData) {
			try {
				const products = JSON.parse(existingData);
				const productIndex = products.findIndex((p: Product) => p.id === productId);

				if (productIndex !== -1) {
					products[productIndex] = {
						...updatedProduct,
						ipfsHash: ipfsHash,
						updatedAt: new Date().toISOString()
					};
					localStorage.setItem(storageKey, JSON.stringify(products));
				}
			} catch (parseError) {
				console.warn('Error updating local storage:', parseError);
			}
		}

		return true;
	} catch (error) {
		console.error('Error updating product metadata:', error);
		return false;
	}
}

// Mint a new product (Manufacturer only)
export async function mintProduct(productData: {
	id: string;
	name: string;
	batch: string;
	quantity: number;
	description?: string;
	category?: string;
	image?: string;
	price?: number;
	specifications?: Record<string, string>;
	ascConfig?: {
		enableQualityMonitoring: boolean;
		temperatureThreshold: string;
		humidityThreshold: string;
		enablePaymentAutomation: boolean;
		paymentConditions: string;
		enableInsurance: boolean;
		insuranceValue: string;
	};
}) {
	try {
		console.log('🚀 Starting product minting process...');
		const provider = await getWeb3Provider();
		console.log('✅ Provider obtained:', provider.address);

		const productRegistry = await getProductRegistryContract();
		console.log('✅ Contract instance created for:', CONFIG.contracts.productRegistry);

		// Create metadata object with ASC configuration
		const metadata: ProductMetadata = {
			productId: productData.id,
			name: productData.name,
			batch: productData.batch,
			quantity: productData.quantity,
			description: productData.description || '',
			category: productData.category || '',
			timestamp: new Date().toISOString(),
			manufacturer: provider.address,
			image: productData.image,
			attributes: [
				{
					trait_type: 'Batch Number',
					value: productData.batch
				},
				{
					trait_type: 'Quantity',
					value: productData.quantity.toString()
				},
				{
					trait_type: 'Manufacturer',
					value: provider.address
				},
				{
					trait_type: 'Category',
					value: productData.category || 'Unknown'
				}
			],
			ascConfig: productData.ascConfig || {
				enableQualityMonitoring: false,
				temperatureThreshold: '25',
				humidityThreshold: '70',
				enablePaymentAutomation: false,
				paymentConditions: 'delivery_confirmation',
				enableInsurance: false,
				insuranceValue: ''
			}
		};

		// Upload metadata to Pinata IPFS
		console.log('📤 Uploading metadata to IPFS...');
		const ipfsHash = await uploadMetadataToPinata(metadata);
		console.log('✅ IPFS upload successful:', ipfsHash);

		console.log('📋 Calling contract with params:', {
			productId: productData.id,
			name: productData.name,
			batch: productData.batch,
			metadataHash: ipfsHash
		});

		// Call the contract
		const operation = await productRegistry.call(
			'mintProduct',
			new Args()
				.addString(productData.id)
				.addString(productData.name)
				.addString(productData.batch)
				.addString(ipfsHash)
				.serialize(),
			{
				coins: Mas.fromString(CONFIG.blockchain.coinAmountDefault),
				maxGas: CONFIG.blockchain.gasLimitDefault
			}
		);

		console.log('⏳ Operation submitted, waiting for confirmation...');
		console.log('Operation ID:', operation.id);

		await operation.waitSpeculativeExecution();
		console.log('✅ Operation confirmed successfully!');

		// Store the minted product locally for immediate retrieval
		await storeProductLocally(productData, provider.address, ipfsHash, operation.id);

		return {
			success: true,
			operationId: operation.id,
			productId: productData.id,
			ipfsHash: ipfsHash
		};
	} catch (error) {
		console.error('❌ Product minting failed with error:', error);

		// Provide more specific error messages
		let errorMessage = 'Unknown error occurred';
		if (error instanceof Error) {
			errorMessage = error.message;

			// Handle specific error types
			if (errorMessage.includes('data entry not found')) {
				errorMessage =
					'Contract storage issue - the ProductRegistry contract may not be properly deployed or initialized';
			} else if (errorMessage.includes('insufficient balance')) {
				errorMessage =
					'Insufficient MAS balance for transaction. Please ensure you have enough MAS tokens.';
			} else if (errorMessage.includes('VM Error')) {
				errorMessage =
					'Smart contract execution error - please check if you have the required permissions';
			}
		}

		return {
			success: false,
			error: `Product minting failed: ${errorMessage}`
		};
	}
}

// Get product details by ID
export async function getProduct(productId: string) {
	try {
		const productRegistry = await getProductRegistryContract();

		const result = await productRegistry.read(
			'getProduct',
			new Args().addString(productId).serialize()
		);

		const productData = new TextDecoder().decode(result.value);
		return { success: true, data: JSON.parse(productData) };
	} catch (error) {
		console.error('Error getting product:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}

// Get products minted by manufacturer
export async function getManufacturerProducts(manufacturerAddress?: string): Promise<Product[]> {
	try {
		// Get the target address - use provided address or current wallet address
		const provider = await getWeb3Provider();
		const targetAddress = manufacturerAddress || provider.address;

		console.log('🔍 Getting manufacturer products for:', targetAddress);
		console.log('🏭 Current wallet address:', provider.address);

		// PRIMARY METHOD: Query IPFS directly for products by manufacturer address
		try {
			console.log('🌐 Querying IPFS for products by manufacturer address...');
			const ipfsFiles = await listProductsByManufacturer(targetAddress);

			if (ipfsFiles && ipfsFiles.length > 0) {
				console.log(`📦 Found ${ipfsFiles.length} product files in IPFS`);
				const products: Product[] = [];

				// Fetch metadata for each product file
				for (const file of ipfsFiles) {
					try {
						console.log(`📄 Fetching metadata for: ${file.metadata.name}`);
						const metadata = await getMetadataFromPinata(file.ipfs_pin_hash);

						// Convert metadata to Product format
						const product: Product = {
							id: metadata.productId,
							name: metadata.name,
							batch: metadata.batch || 'Unknown',
							quantity: metadata.quantity || 1,
							category: metadata.category || '',
							description: metadata.description || '',
							status: 'Active',
							mintedAt: metadata.timestamp || new Date().toISOString(),
							manufacturer: metadata.manufacturer,
							ipfsHash: file.ipfs_pin_hash
						};

						products.push(product);
						console.log(`✅ Added product: ${product.name} (${product.id})`);
					} catch (metadataError) {
						console.warn(`Failed to fetch metadata for ${file.metadata.name}:`, metadataError);
					}
				}

				if (products.length > 0) {
					console.log(`🎉 Successfully retrieved ${products.length} products from IPFS`);
					// Store them locally for faster future access
					const storageKey = `minted-products-${targetAddress}`;
					localStorage.setItem(storageKey, JSON.stringify(products));
					return products;
				}
			}
		} catch (ipfsError) {
			console.warn('IPFS query failed:', ipfsError);
		}

		// FALLBACK METHOD: Try blockchain if IPFS fails
		try {
			console.log('🔄 Trying blockchain fallback...');
			const productRegistry = await getProductRegistryContract();

			const result = await productRegistry.read(
				'getManufacturerProducts',
				new Args().addString(targetAddress).serialize()
			);

			if (result && result.value) {
				const data = new TextDecoder().decode(result.value);
				console.log('📋 Blockchain response:', data);

				if (data && data.trim() !== '' && data !== '[]') {
					try {
						const products = JSON.parse(data) as Product[];
						if (products && products.length > 0) {
							console.log('✅ Found products from blockchain:', products.length);
							return products;
						}
					} catch (parseError) {
						console.warn('Failed to parse blockchain response:', parseError);
					}
				}
			}
		} catch (blockchainError) {
			console.warn('Blockchain query failed:', blockchainError);
		}

		// FINAL FALLBACK: Check local storage and stored operations
		console.log('🔄 Trying local storage and operation tracking...');

		// Try local storage first
		const storageKey = `minted-products-${targetAddress}`;
		const storedProducts = localStorage.getItem(storageKey);
		if (storedProducts) {
			try {
				const localProducts = JSON.parse(storedProducts) as Product[];
				console.log('✅ Found locally stored products:', localProducts.length);
				return localProducts;
			} catch (parseError) {
				console.warn('Failed to parse stored products:', parseError);
			}
		}

		// Try stored operations
		try {
			const recentProducts = await getProductsFromRecentOperations(targetAddress);
			if (recentProducts.length > 0) {
				console.log('✅ Found products from stored operations:', recentProducts.length);
				return recentProducts;
			}
		} catch (operationError) {
			console.warn('Failed to get products from operations:', operationError);
		}

		console.log('📝 No products found for manufacturer:', targetAddress);
		return [];
	} catch (error) {
		console.error('Error getting manufacturer products:', error);
		return [];
	}
}

// Helper function to store product locally after minting
async function storeProductLocally(
	productData: {
		id: string;
		name: string;
		batch: string;
		quantity: number;
		category?: string;
		description?: string;
	},
	manufacturerAddress: string,
	ipfsHash: string,
	operationId: string
) {
	try {
		const mintedProduct: Product = {
			id: productData.id,
			name: productData.name,
			batch: productData.batch,
			quantity: productData.quantity,
			category: productData.category || '',
			description: productData.description || '',
			status: 'Active',
			mintedAt: new Date().toISOString(),
			manufacturer: manufacturerAddress,
			ipfsHash: ipfsHash
		};

		const storageKey = `minted-products-${manufacturerAddress}`;
		const existingProducts = localStorage.getItem(storageKey);
		let productList: Product[] = [];

		if (existingProducts) {
			try {
				productList = JSON.parse(existingProducts);
			} catch {
				console.warn('Failed to parse existing products, starting fresh');
				productList = [];
			}
		}

		// Add new product to the list
		productList.push(mintedProduct);
		localStorage.setItem(storageKey, JSON.stringify(productList));
		console.log('✅ Product stored locally for immediate retrieval');

		// Also store the operation mapping for future retrieval
		const operationKey = `mint-operations-${manufacturerAddress}`;
		const existingOperations = localStorage.getItem(operationKey);
		let operationList: Array<{ operationId: string; productId: string }> = [];

		if (existingOperations) {
			try {
				operationList = JSON.parse(existingOperations);
			} catch {
				console.warn('Failed to parse existing operations, starting fresh');
				operationList = [];
			}
		}

		operationList.push({
			operationId: operationId,
			productId: productData.id
		});
		localStorage.setItem(operationKey, JSON.stringify(operationList));
		console.log('✅ Operation mapping stored for future retrieval');
	} catch (storageError) {
		console.warn('Failed to store product locally:', storageError);
	}
}

// Helper function to get products from recent operations
async function getProductsFromRecentOperations(manufacturerAddress: string): Promise<Product[]> {
	try {
		console.log('🔍 Trying to get products from stored operation IDs...');
		const products: Product[] = [];

		// First, try to get product IDs from localStorage where we track minting operations
		const operationKey = `mint-operations-${manufacturerAddress}`;
		const storedOperations = localStorage.getItem(operationKey);

		if (storedOperations) {
			try {
				const operations = JSON.parse(storedOperations) as Array<{
					operationId: string;
					productId: string;
				}>;
				console.log(`Found ${operations.length} stored operations to check`);

				for (const op of operations) {
					try {
						const result = await getProduct(op.productId);
						if (result.success && result.data) {
							const productData = result.data;
							if (productData.manufacturer === manufacturerAddress) {
								console.log(`✅ Found product from stored operation: ${op.productId}`);
								const product: Product = {
									id: productData.productId || op.productId,
									name: productData.name || 'Unknown Product',
									batch: productData.batch || 'Unknown',
									quantity: productData.quantity || 1,
									category: productData.category || '',
									description: productData.description || '',
									status: 'Active',
									mintedAt: productData.timestamp || new Date().toISOString(),
									manufacturer: manufacturerAddress,
									ipfsHash: productData.ipfsHash || ''
								};
								products.push(product);
							}
						}
					} catch (error) {
						console.log(`Product ${op.productId} not found or error:`, error);
					}
				}
			} catch (parseError) {
				console.warn('Failed to parse stored operations:', parseError);
			}
		}

		if (products.length > 0) {
			console.log(`✅ Found ${products.length} products from stored operations`);
			return products;
		}

		// If no stored operations, show message about the real issue
		console.log('❌ No stored product operations found.');
		console.log('💡 This means either:');
		console.log('   1. Products were minted in a different session/browser');
		console.log(
			'   2. The smart contract getManufacturerProducts function needs to be implemented'
		);
		console.log('   3. Browser storage was cleared');

		return [];
	} catch (error) {
		console.error('Error getting products from operations:', error);
		return [];
	}
}

// Test function to try retrieving a specific product by ID
export async function testGetSpecificProduct(productId: string) {
	try {
		console.log('🧪 Testing retrieval of specific product:', productId);
		const result = await getProduct(productId);
		console.log('🧪 Test result:', result);
		return result;
	} catch (error) {
		console.error('🧪 Test failed:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}

// Get all products (alias for compatibility)
export async function getProducts() {
	// Import marketplace service to avoid circular dependency
	const { getAvailableProducts } = await import('./marketplace-service');
	return getAvailableProducts();
}
