// Massa Web3 integration for frontend
import { Args, SmartContract, Mas } from '@massalabs/massa-web3';
import { getWallets, WalletName } from '@massalabs/wallet-provider';
import {
	uploadMetadataToPinata,
	listProductsByManufacturer,
	getMetadataFromPinata
} from './pinata';
import type { Product, BatchMetadata, TokenMetadata, ProductMetadata } from './types';
import { get } from 'svelte/store';
import { provider } from './stores/auth';

// Browser-compatible account provider using wallet-provider
export async function getAccountProvider() {
	// First try to get the provider from the auth store (if user is connected)
	const currentProvider = get(provider);

	if (currentProvider) {
		return currentProvider;
	}

	// Fallback: Get available wallets in browser (if not connected via auth)
	const walletList = await getWallets();

	if (walletList.length === 0) {
		throw new Error(
			'No compatible wallet found. Please install MassaStation or another Massa wallet.'
		);
	}

	// Try to find MassaStation wallet first
	let wallet = walletList.find((w) => w.name() === WalletName.MassaWallet);

	// If MassaStation not found, use first available wallet
	if (!wallet) {
		wallet = walletList[0];
	}

	// Get accounts from the wallet
	const accounts = await wallet.accounts();

	if (accounts.length === 0) {
		throw new Error('No accounts found in wallet. Please create an account first.');
	}

	// Return the first account as provider
	return accounts[0];
}

// Contract addresses from deployed contracts
export const CONTRACT_ADDRESSES = {
	ACCESS_CONTROL: 'AS12JiKF6YLc2eQCYdvZuybvXoHM38obVqCPRRcF1awznuafPNCBN',
	PRODUCT_REGISTRY: 'AS12jcTBpFu1HhiAvmWyzkgHN4ZD2tuvXMTvWCo31GK16kx7TX95t',
	PARTICIPANT_REGISTRY: 'AS12jqeC36vTEEQjYK6h7WJi83HMQDLQATkqpnScy6NqVC48nbGR8',
	DID_REGISTRY: 'AS1JMsReetZg6c5Eqmen6X5oEuv69d1V66oLNM2yHyuXUiagLjjt',
	REQUEST_MARKETPLACE: 'AS12NR9BWBs5pxVTAHuSrKsGmnSrooxxYe2mBNbUnUeFFZhSqHKX2'
};

// Get user's web3 provider
export async function getWeb3Provider() {
	try {
		return await getAccountProvider();
	} catch (error) {
		console.error('Failed to get provider:', error);
		throw error;
	}
}

// Test contract connection and initialization
export async function testContractConnection() {
	try {
		const provider = await getWeb3Provider();
		const productRegistry = new SmartContract(provider, CONTRACT_ADDRESSES.PRODUCT_REGISTRY);

		// Try to read a simple value from the contract
		try {
			await productRegistry.read(
				'getProduct',
				new Args().addString('test-nonexistent-id').serialize()
			);
			return { success: true, message: 'Contract is accessible' };
		} catch (readError) {
			// If it's a "data entry not found" error, that might mean the contract exists but the storage key doesn't
			const errorMessage = readError instanceof Error ? readError.message : String(readError);
			if (errorMessage.includes('data entry not found')) {
				return {
					success: true,
					message: 'Contract exists but storage entry not found (normal for test)'
				};
			}
			return { success: false, error: 'Contract not responding to read calls: ' + errorMessage };
		}
	} catch (error) {
		console.error('Contract connection test failed:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}

// Create a new batch record
export async function createBatch(batchData: {
	batchId: string;
	name: string;
	description: string;
	category: string;
	totalQuantity: number;
	image?: string;
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
		const provider = await getWeb3Provider();

		const productRegistry = new SmartContract(provider, CONTRACT_ADDRESSES.PRODUCT_REGISTRY);

		// Create batch metadata
		const batchMetadata: BatchMetadata = {
			batchId: batchData.batchId,
			name: batchData.name,
			description: batchData.description,
			category: batchData.category,
			totalQuantity: batchData.totalQuantity,
			manufacturer: provider.address,
			timestamp: new Date().toISOString(),
			image: batchData.image,
			attributes: [
				{
					trait_type: 'Total Quantity',
					value: batchData.totalQuantity.toString()
				},
				{
					trait_type: 'Manufacturer',
					value: provider.address
				},
				{
					trait_type: 'Category',
					value: batchData.category
				}
			],
			ascConfig: batchData.ascConfig || {
				enableQualityMonitoring: false,
				temperatureThreshold: '25',
				humidityThreshold: '70',
				enablePaymentAutomation: false,
				paymentConditions: 'delivery_confirmation',
				enableInsurance: false,
				insuranceValue: ''
			}
		};

		// Upload batch metadata to IPFS
		const ipfsHash = await uploadMetadataToPinata(
			batchMetadata as unknown as Record<string, unknown>
		);

		// Call contract to create batch record
		const operation = await productRegistry.call(
			'createBatch',
			new Args()
				.addString(batchData.batchId)
				.addString(batchData.name)
				.addString(batchData.description)
				.addU64(BigInt(batchData.totalQuantity))
				.addString(ipfsHash)
				.serialize(),
			{
				fee: Mas.fromString('0.05'),
				maxGas: BigInt(150_000_000)
			}
		);

		await operation.waitSpeculativeExecution();

		return {
			success: true,
			operationId: operation.id,
			batchId: batchData.batchId,
			ipfsHash: ipfsHash
		};
	} catch (error) {
		console.error('Batch creation failed:', error);
		return {
			success: false,
			error: `Batch creation failed: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

// Mint individual tokens for a batch
export async function mintProductTokens(batchId: string, quantity: number) {
	try {
		console.log(`🚀 Minting ${quantity} individual tokens for batch ${batchId}...`);
		const provider = await getWeb3Provider();

		const productRegistry = new SmartContract(provider, CONTRACT_ADDRESSES.PRODUCT_REGISTRY);

		// Get batch details first
		const batchResult = await productRegistry.read(
			'getBatch',
			new Args().addString(batchId).serialize()
		);
		const batchData = JSON.parse(new TextDecoder().decode(batchResult.value));

		// Fetch batch metadata from IPFS
		let batchMetadata: BatchMetadata = {} as BatchMetadata;
		if (batchData.ipfsHash) {
			try {
				const metadataResponse = await fetch(
					`https://gateway.pinata.cloud/ipfs/${batchData.ipfsHash}`
				);
				if (metadataResponse.ok) {
					batchMetadata = await metadataResponse.json();
				}
			} catch (error) {
				console.error('Failed to fetch batch metadata:', error);
			}
		}

		const mintedTokens: string[] = [];

		// Mint individual tokens
		for (let i = 1; i <= quantity; i++) {
			const tokenId = `${batchId}-#${i.toString().padStart(3, '0')}`;

			// Create individual token metadata
			const tokenMetadata: TokenMetadata = {
				tokenId: tokenId,
				batchId: batchId,
				serialNumber: i,
				totalInBatch: quantity,
				name: `${batchMetadata.name || 'Product'} #${i}`,
				description: `${batchMetadata.description || 'Product token'} - Serial ${i} of ${quantity}`,
				category: batchMetadata.category || '',
				manufacturer: provider.address,
				timestamp: new Date().toISOString(),
				image: batchMetadata.image,
				attributes: [
					{
						trait_type: 'Batch ID',
						value: batchId
					},
					{
						trait_type: 'Serial Number',
						value: `${i}/${quantity}`
					},
					{
						trait_type: 'Manufacturer',
						value: provider.address
					},
					{
						trait_type: 'Category',
						value: batchMetadata.category || 'Unknown'
					}
				]
			};

			// Upload token metadata to IPFS
			const tokenIpfsHash = await uploadMetadataToPinata(
				tokenMetadata as unknown as Record<string, unknown>
			);

			// Mint individual token
			const operation = await productRegistry.call(
				'mintToken',
				new Args()
					.addString(tokenId)
					.addString(batchId)
					.addU64(BigInt(i))
					.addString(tokenIpfsHash)
					.serialize(),
				{
					fee: Mas.fromString('0.02'),
					maxGas: BigInt(100_000_000)
				}
			);

			await operation.waitSpeculativeExecution();
			mintedTokens.push(tokenId);
			console.log(`✅ Token ${i}/${quantity} minted: ${tokenId}`);
		}

		console.log(`✅ All ${quantity} tokens minted successfully!`);
		return {
			success: true,
			batchId: batchId,
			mintedTokens: mintedTokens,
			totalMinted: quantity
		};
	} catch (error) {
		console.error('❌ Token minting failed:', error);
		return {
			success: false,
			error: `Token minting failed: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

// Check if user has specific role
export async function checkUserRole(roleName: string): Promise<boolean> {
	try {
		const provider = await getWeb3Provider();
		const accessControl = new SmartContract(provider, CONTRACT_ADDRESSES.ACCESS_CONTROL);

		const hasRole = await accessControl.read(
			'hasRole',
			new Args().addString(provider.address).addString(roleName).serialize()
		);

		const result = new TextDecoder().decode(hasRole.value);
		return result.includes('true');
	} catch (error) {
		console.error('Error checking role:', error);
		return false;
	}
}

// Request role assignment
export async function requestRole(roleName: string, justification: string) {
	try {
		const provider = await getWeb3Provider();
		const accessControl = new SmartContract(provider, CONTRACT_ADDRESSES.ACCESS_CONTROL);

		console.log('🔐 Requesting role:', roleName);
		console.log('📝 Justification:', justification);

		const operation = await accessControl.call(
			'requestRole',
			new Args().addString(roleName).addString(justification).serialize(),
			{
				fee: Mas.fromString('0.01') // Use fee instead of coins
			}
		);

		await operation.waitSpeculativeExecution();

		return { success: true, operationId: operation.id };
	} catch (error) {
		console.error('Role request failed:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
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
		const provider = await getWeb3Provider();
		const productRegistry = new SmartContract(provider, CONTRACT_ADDRESSES.PRODUCT_REGISTRY);

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
		const ipfsHash = await uploadMetadataToPinata(metadata);

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
				fee: Mas.fromString('0.1'),
				maxGas: BigInt(200_000_000)
			}
		);

		await operation.waitSpeculativeExecution();

		return {
			success: true,
			operationId: operation.id,
			productId: productData.id,
			ipfsHash: ipfsHash
		};
	} catch (error) {
		console.error('Product minting failed:', error);

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

// Get product details
export async function getProduct(productId: string) {
	try {
		const provider = await getWeb3Provider();
		const productRegistry = new SmartContract(provider, CONTRACT_ADDRESSES.PRODUCT_REGISTRY);

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

// Get user's current address
export async function getUserAddress(): Promise<string> {
	try {
		const provider = await getWeb3Provider();
		return provider.address;
	} catch (error) {
		console.error('Error getting user address:', error);
		return '';
	}
}

// Get user's role (returns role name or null)
export async function getUserRole(): Promise<string | null> {
	try {
		// Check roles using uppercase names for contract, return lowercase for consistency
		const roleMap = [
			{ contract: 'ADMIN', result: 'admin' },
			{ contract: 'MANUFACTURER', result: 'manufacturer' },
			{ contract: 'LOGISTICS', result: 'logistics' },
			{ contract: 'CONSUMER', result: 'consumer' }
		];

		for (const { contract, result } of roleMap) {
			const hasRole = await checkUserRole(contract);
			if (hasRole) {
				return result;
			}
		}

		return null;
	} catch (error) {
		console.error('Error getting user role:', error);
		return null;
	}
}

// Get products owned by user (consumer)
export async function getUserProducts(userAddress: string) {
	try {
		// TODO: Implement real blockchain query for products owned by the user
		// This will query the ProductRegistry contract for products where owner === userAddress
		console.log('Getting products for user:', userAddress);

		// For now, return empty array until blockchain integration is complete
		return [];
	} catch (error) {
		console.error('Error getting user products:', error);
		return [];
	}
}

// Get products minted by manufacturer
export async function getManufacturerProducts(manufacturerAddress?: string): Promise<Product[]> {
	try {
		// Get the target address - use provided address or current wallet address
		const provider = await getWeb3Provider();
		const targetAddress = manufacturerAddress || provider.address;

		// PRIMARY METHOD: Query IPFS directly for products by manufacturer address
		try {
			const ipfsFiles = await listProductsByManufacturer(targetAddress);

			if (ipfsFiles && ipfsFiles.length > 0) {
				const products: Product[] = [];

				// Fetch metadata for each product file
				for (const file of ipfsFiles) {
					try {
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
			const productRegistry = new SmartContract(provider, CONTRACT_ADDRESSES.PRODUCT_REGISTRY);

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

		// Try local storage first
		const storageKey = `minted-products-${targetAddress}`;
		const storedProducts = localStorage.getItem(storageKey);
		if (storedProducts) {
			try {
				const localProducts = JSON.parse(storedProducts) as Product[];
				return localProducts;
			} catch (parseError) {
				console.warn('Failed to parse stored products:', parseError);
			}
		}

		// Try stored operations
		try {
			const recentProducts = await getProductsFromRecentOperations(targetAddress);
			if (recentProducts.length > 0) {
				return recentProducts;
			}
		} catch (operationError) {
			console.warn('Failed to get products from operations:', operationError);
		}

		console.log('� No products found for manufacturer:', targetAddress);
		return [];
	} catch (error) {
		console.error('Error getting manufacturer products:', error);
		return [];
	}
} // Helper function to get products from recent operations
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

				for (const op of operations) {
					try {
						const result = await getProduct(op.productId);
						if (result.success && result.data) {
							const productData = result.data;
							if (productData.manufacturer === manufacturerAddress) {
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
			return products;
		}

		return [];
	} catch (error) {
		console.error('Error getting products from operations:', error);
		return [];
	}
}

// Test function to try retrieving a specific product by ID
export async function testGetSpecificProduct(productId: string) {
	try {
		const result = await getProduct(productId);
		return result;
	} catch (error) {
		console.error('Test failed:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}

// Export for browser console testing
if (typeof window !== 'undefined') {
	(window as unknown as Record<string, unknown>).testGetSpecificProduct = testGetSpecificProduct;
	(window as unknown as Record<string, unknown>).getManufacturerProducts = getManufacturerProducts;
	(window as unknown as Record<string, unknown>).debugContractRequests = async () => {
		try {
			console.log('DEBUG: Testing contract request storage...');
			const provider = await getWeb3Provider();
			const requestMarketplace = new SmartContract(
				provider,
				CONTRACT_ADDRESSES.REQUEST_MARKETPLACE
			);

			console.log('Current address:', provider.address);
			console.log('Contract address:', CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

			// Test 1: Get request counter
			try {
				const counterResult = await requestMarketplace.read(
					'getTotalRequestCount',
					new Args().serialize()
				);
				const counterDecoded = new TextDecoder().decode(counterResult.value);
				console.log('Total requests in contract:', counterDecoded);
			} catch (e) {
				console.log('Request counter failed:', e);
			}

			// Test 2: Get contract info to verify deployment
			try {
				const infoResult = await requestMarketplace.read('getContractInfo', new Args().serialize());
				const infoDecoded = new TextDecoder().decode(infoResult.value);
				console.log('Contract info:', infoDecoded);
			} catch (e) {
				console.log('Contract info failed:', e);
			}

			// Test 3: Get consumer requests
			try {
				const consumerResult = await requestMarketplace.read(
					'getConsumerRequests',
					new Args().addString(provider.address).serialize()
				);
				const consumerDecoded = new TextDecoder().decode(consumerResult.value);
				console.log('Consumer requests:', consumerDecoded);
			} catch (e) {
				console.log('Consumer requests failed:', e);
			}

			// Test 4: Get manufacturer requests
			try {
				const mfgResult = await requestMarketplace.read(
					'getPendingRequests',
					new Args().addString(provider.address).serialize()
				);
				const mfgDecoded = new TextDecoder().decode(mfgResult.value);
				console.log('Manufacturer requests:', mfgDecoded);
			} catch (e) {
				console.log('Manufacturer requests failed:', e);
			}
		} catch (error) {
			console.error('Manual debug failed:', error);
		}
	};
}

// ============================================
// REQUEST MARKETPLACE CONTRACT FUNCTIONS
// ============================================

/**
 * Create a product request on-chain
 */
export async function createProductRequestOnChain(
	productId: string,
	quantity: number,
	manufacturerId: string,
	shippingAddressHash: string,
	message?: string
): Promise<{ success: boolean; requestId?: string; operationId?: string; error?: string }> {
	try {
		const provider = await getWeb3Provider();
		const requestMarketplace = new SmartContract(provider, CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

		// Generate unique request ID
		const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		const args = new Args()
			.addString(requestId)
			.addString(productId)
			.addU32(BigInt(quantity))
			.addString(manufacturerId)
			.addString(shippingAddressHash)
			.addString(message || '');

		const operation = await requestMarketplace.call('createProductRequest', args.serialize(), {
			coins: Mas.fromString('0'),
			maxGas: BigInt(2000000),
			fee: Mas.fromString('0.01')
		});

		// Wait for execution
		await operation.waitSpeculativeExecution();

		return {
			success: true,
			requestId,
			operationId: operation.id
		};
	} catch (error) {
		console.error('Failed to create product request on-chain:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to create request on blockchain'
		};
	}
}

/**
 * Get pending requests for a manufacturer from the blockchain
 */
export async function getPendingRequestsFromChain(manufacturerId: string): Promise<unknown[]> {
	try {
		const provider = await getWeb3Provider();
		const requestMarketplace = new SmartContract(provider, CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

		const args = new Args().addString(manufacturerId);

		const result = await requestMarketplace.read('getPendingRequests', args.serialize());

		// Decode the result - this would depend on your contract's return format
		const requests = JSON.parse(new TextDecoder().decode(result.value));

		return requests;
	} catch (error) {
		console.error('Failed to get pending requests from blockchain:', error);
		// Return empty array if contract call fails
		return [];
	}
}

/**
 * Approve a product request on-chain
 */
export async function approveProductRequestOnChain(
	requestId: string
): Promise<{ success: boolean; operationId?: string; error?: string }> {
	try {
		const provider = await getWeb3Provider();
		const requestMarketplace = new SmartContract(provider, CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

		console.log('⛓️ Approving product request on-chain:', requestId);
		console.log('🔍 Using wallet address:', provider.address);
		console.log('🔍 Contract address:', CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

		const args = new Args().addString(requestId);

		const operation = await requestMarketplace.call('approveRequest', args.serialize(), {
			fee: Mas.fromString('0.01')
		});

		console.log('✅ Product request approval transaction submitted');
		console.log('🔗 Operation ID:', operation.id);
		console.log('⏳ Waiting for transaction confirmation...');

		// Wait a bit for transaction to be processed
		await new Promise((resolve) => setTimeout(resolve, 3000));

		console.log('✅ Approval transaction should be confirmed now');

		return {
			success: true,
			operationId: operation.id
		};
	} catch (error) {
		console.error('❌ Failed to approve product request on-chain:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to approve request on blockchain'
		};
	}
}

/**
 * Reject a product request on-chain
 */
export async function rejectProductRequestOnChain(
	requestId: string,
	reason: string
): Promise<{ success: boolean; operationId?: string; error?: string }> {
	try {
		const provider = await getWeb3Provider();
		const requestMarketplace = new SmartContract(provider, CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

		console.log('⛓️ Rejecting product request on-chain:', requestId);

		const args = new Args().addString(requestId).addString(reason);

		const operation = await requestMarketplace.call('rejectRequest', args.serialize(), {
			fee: Mas.fromString('0.01')
		});

		console.log('✅ Product request rejected on-chain');
		console.log('🔗 Operation ID:', operation.id);

		return {
			success: true,
			operationId: operation.id
		};
	} catch (error) {
		console.error('❌ Failed to reject product request on-chain:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to reject request on blockchain'
		};
	}
}

/**
 * Get all requests for a consumer from the blockchain
 */
export async function getConsumerRequestsFromChain(consumerAddress?: string): Promise<unknown[]> {
	try {
		const provider = await getWeb3Provider();
		const requestMarketplace = new SmartContract(provider, CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

		const actualConsumerAddress = consumerAddress || provider.address;
		const args = new Args().addString(actualConsumerAddress);
		const result = await requestMarketplace.read('getConsumerRequests', args.serialize());

		if (!result.value || result.value.length === 0) {
			return [];
		}

		const decodedString = new TextDecoder().decode(result.value);

		if (!decodedString || decodedString.trim() === '' || decodedString === '[]') {
			return [];
		}

		try {
			const requests = JSON.parse(decodedString);
			return requests;
		} catch (parseError) {
			console.error('Failed to parse consumer requests JSON:', parseError);
			return [];
		}
	} catch (error) {
		console.error('Failed to get consumer requests from blockchain:', error);
		return [];
	}
}
