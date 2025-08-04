/**
 * Marketplace Service
 * Handles product discovery, consumer requests, and cross-role product assignments
 * All data is stored on-chain with IPFS for shipping addresses
 */

import { getManufacturerProducts, getProductById } from './product-service';
import { getUserAddress } from '../provider/provider';
import {
	createProductRequestOnChain,
	getPendingRequestsFromChain,
	approveProductRequestOnChain,
	rejectProductRequestOnChain,
	getConsumerRequestsFromChain
} from '../web3';
import { storeShippingAddressInIPFS, getShippingAddressFromIPFS } from '../utils/ipfs-helpers';
import type { Product } from '../types';

// Define interface for blockchain request data
interface BlockchainRequestData {
	requestId?: string;
	id?: string;
	productId: string;
	consumerId: string;
	manufacturerId: string;
	requestedAt?: string;
	status?: string;
	quantity?: string | number;
	shippingAddressHash?: string;
	message?: string;
	rejectionReason?: string;
	processedAt?: string;
}

export interface ProductRequest {
	id: string;
	productId: string;
	consumerId: string;
	consumerName: string;
	manufacturerId: string;
	manufacturerName: string;
	requestedAt: string;
	status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
	message?: string;
	quantity: number;
	approvedBy?: string;
	approvedAt?: string;
	rejectionReason?: string;
	shippingAddress: {
		fullName: string;
		addressLine1: string;
		addressLine2?: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
		phoneNumber?: string;
	};
}

/**
 * Get all products available in the marketplace
 * Aggregates products from all manufacturers with available stock
 */
export async function getAvailableProducts(): Promise<Product[]> {
	try {
		console.log('🛒 Loading marketplace products...');

		// Get products from current user (if they're a manufacturer)
		let allProducts: Product[] = [];

		try {
			const userProducts = await getManufacturerProducts();
			allProducts = [...userProducts];
			console.log(`📦 Found ${userProducts.length} products from current user`);
		} catch {
			console.log('ℹ️ Current user is not a manufacturer or no products found');
		}

		// TODO: In the future, implement querying all manufacturers
		// For now, we'll show products from the current ecosystem

		// Only return products with available stock
		const availableProducts = allProducts.filter((product) => product.quantity > 0);
		console.log(`✅ ${availableProducts.length} products available in marketplace`);

		return availableProducts;
	} catch (error) {
		console.error('Error fetching available products:', error);
		throw new Error('Failed to load marketplace products');
	}
}

/**
 * Consumer requests a product from a manufacturer
 */
export async function requestProduct(
	productId: string,
	consumerAddress: string,
	quantity: number = 1,
	message?: string,
	shippingAddress?: {
		fullName: string;
		addressLine1: string;
		addressLine2?: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
		phoneNumber?: string;
	}
): Promise<{ success: boolean; requestId?: string; error?: string }> {
	try {
		// Validate shipping address
		if (!shippingAddress) {
			return { success: false, error: 'Shipping address is required' };
		}

		// Validate required shipping fields
		const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
		for (const field of requiredFields) {
			if (!shippingAddress[field as keyof typeof shippingAddress]?.trim()) {
				return { success: false, error: `${field} is required for shipping` };
			}
		}

		// Get product details - search across available products
		console.log('🔍 Searching for product:', productId);
		const product = await getProductById(productId);

		if (!product) {
			console.log('❌ Product not found:', productId);
			return { success: false, error: 'Product not found' };
		}

		console.log('✅ Product found:', product.name);

		if (product.quantity < quantity) {
			return { success: false, error: 'Insufficient stock available' };
		}

		// Store shipping address in IPFS
		console.log('📦 Storing shipping address in IPFS...');
		const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		const ipfsResult = await storeShippingAddressInIPFS(shippingAddress, requestId);
		if (!ipfsResult.success) {
			return { success: false, error: 'Failed to store shipping address: ' + ipfsResult.error };
		}

		// Create request on blockchain
		console.log('🔗 Creating product request on blockchain...');
		const blockchainResult = await createProductRequestOnChain(
			productId,
			quantity,
			product.manufacturer,
			ipfsResult.ipfsHash!,
			message
		);

		if (!blockchainResult.success) {
			return {
				success: false,
				error: 'Failed to create request on blockchain: ' + blockchainResult.error
			};
		}

		console.log('✅ Product request created successfully:', {
			requestId,
			operationId: blockchainResult.operationId,
			ipfsHash: ipfsResult.ipfsHash
		});

		return { success: true, requestId };
	} catch (error) {
		console.error('Error requesting product:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to request product'
		};
	}
}

/**
 * Get pending product requests (for manufacturers and admins)
 */
export async function getPendingRequests(userAddress?: string): Promise<ProductRequest[]> {
	try {
		const currentUserAddress = userAddress || (await getUserAddress());

		console.log('🔍 Getting pending requests for manufacturer:', currentUserAddress);

		// Get pending requests from blockchain
		const requests = await getPendingRequestsFromChain(currentUserAddress);

		console.log('📊 Raw blockchain requests:', requests);

		// Convert blockchain requests to our interface format
		const manufacturerRequests: ProductRequest[] = [];

		for (const req of requests) {
			const requestData = req as BlockchainRequestData;

			console.log('🔍 Processing request:', {
				id: requestData.requestId || requestData.id,
				status: requestData.status,
				consumerId: requestData.consumerId,
				manufacturerId: requestData.manufacturerId
			});

			// Get shipping address from IPFS
			let shippingAddress = {
				fullName: 'Loading...',
				addressLine1: 'Loading...',
				city: 'Loading...',
				state: 'Loading...',
				postalCode: 'Loading...',
				country: 'Loading...'
			};

			try {
				if (requestData.shippingAddressHash) {
					const ipfsResult = await getShippingAddressFromIPFS(requestData.shippingAddressHash);
					if (ipfsResult.success && ipfsResult.shippingAddress) {
						shippingAddress = ipfsResult.shippingAddress;
					}
				}
			} catch (error) {
				console.warn('Failed to load shipping address from IPFS:', error);
			}

			manufacturerRequests.push({
				id: requestData.requestId || requestData.id || 'unknown',
				productId: requestData.productId,
				consumerId: requestData.consumerId,
				consumerName: `Consumer ${requestData.consumerId?.slice(-6) || 'Unknown'}`,
				manufacturerId: requestData.manufacturerId,
				manufacturerName: `Manufacturer ${requestData.manufacturerId?.slice(-6) || 'Unknown'}`,
				requestedAt: requestData.requestedAt || new Date().toISOString(),
				status:
					(requestData.status as 'pending' | 'approved' | 'rejected' | 'fulfilled') || 'pending',
				quantity: Number(requestData.quantity) || 1,
				shippingAddress
			});
		}

		console.log('✅ Converted requests for this manufacturer:', manufacturerRequests);
		console.log('📊 Status breakdown:', {
			pending: manufacturerRequests.filter((r) => r.status === 'pending').length,
			approved: manufacturerRequests.filter((r) => r.status === 'approved').length,
			rejected: manufacturerRequests.filter((r) => r.status === 'rejected').length,
			fulfilled: manufacturerRequests.filter((r) => r.status === 'fulfilled').length
		});

		return manufacturerRequests;
	} catch (error) {
		console.error('Error fetching pending requests:', error);
		throw new Error('Failed to load pending requests');
	}
}

/**
 * Get all product requests (for admin view or manufacturer's own requests)
 */
export async function getAllProductRequests(
	manufacturerAddress?: string
): Promise<ProductRequest[]> {
	try {
		if (manufacturerAddress) {
			// Return requests for specific manufacturer - use the pending requests function
			return await getPendingRequests(manufacturerAddress);
		}

		// For admin view, we'd need a different blockchain call to get ALL requests
		// For now, return current user's requests
		const currentUserAddress = await getUserAddress();
		return await getPendingRequests(currentUserAddress);
	} catch (error) {
		console.error('Error fetching all product requests:', error);
		throw new Error('Failed to load product requests');
	}
}

/**
 * Approve a product request (manufacturer action)
 */
export async function approveProductRequest(
	requestId: string
): Promise<{ success: boolean; error?: string; operationId?: string; nextSteps?: string[] }> {
	try {
		console.log('🔗 Approving product request on blockchain:', requestId);

		// Approve the request on blockchain
		const blockchainResult = await approveProductRequestOnChain(requestId);

		if (!blockchainResult.success) {
			return {
				success: false,
				error: 'Failed to approve request on blockchain: ' + blockchainResult.error
			};
		}

		console.log('✅ Product request approved successfully on blockchain');

		// TODO: Complete implementation steps:
		const nextSteps = [
			'✅ Request approved and recorded on blockchain',
			'🔄 Next: Update product inventory',
			'📦 Next: Create shipment request for logistics',
			'💰 Next: Process payment (if automation enabled)',
			'🔔 Next: Notify consumer of approval',
			'⛓️ Next: Record additional transaction details'
		];

		console.log('Request approved. Next steps:', nextSteps);

		return {
			success: true,
			operationId: blockchainResult.operationId,
			nextSteps
		};
	} catch (error) {
		console.error('Error approving product request:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to approve request'
		};
	}
}

/**
 * Reject a product request (manufacturer action)
 */
export async function rejectProductRequest(
	requestId: string,
	reason: string
): Promise<{ success: boolean; error?: string }> {
	try {
		console.log('🔗 Rejecting product request on blockchain:', requestId);

		// Reject the request on blockchain
		const blockchainResult = await rejectProductRequestOnChain(requestId, reason);

		if (!blockchainResult.success) {
			return {
				success: false,
				error: 'Failed to reject request on blockchain: ' + blockchainResult.error
			};
		}

		console.log('✅ Product request rejected successfully on blockchain');

		return { success: true };
	} catch (error) {
		console.error('Error rejecting product request:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to reject request'
		};
	}
}

/**
 * Get consumer's product requests
 */
export async function getConsumerRequests(consumerAddress?: string): Promise<ProductRequest[]> {
	try {
		const currentUserAddress = consumerAddress || (await getUserAddress());

		console.log('🔍 Getting consumer requests for:', currentUserAddress);

		// Get consumer requests from blockchain
		const blockchainRequests = await getConsumerRequestsFromChain(currentUserAddress);

		console.log('📊 Raw consumer blockchain requests:', blockchainRequests);

		// Convert blockchain data to ProductRequest format
		const requests: ProductRequest[] = [];

		for (const data of blockchainRequests) {
			const requestData = data as BlockchainRequestData;

			console.log('🔍 Processing consumer request:', {
				id: requestData.requestId,
				status: requestData.status,
				productId: requestData.productId,
				quantity: requestData.quantity,
				processedAt: requestData.processedAt
			});

			// Get shipping address from IPFS if available
			let shippingAddress = null;
			if (requestData.shippingAddressHash) {
				try {
					const result = await getShippingAddressFromIPFS(requestData.shippingAddressHash);
					if (result.success && result.shippingAddress) {
						shippingAddress = result.shippingAddress;
					}
				} catch (error) {
					console.warn('Failed to get shipping address from IPFS:', error);
				}
			}

			// Default shipping address if none found
			if (!shippingAddress) {
				shippingAddress = {
					fullName: 'Address Loading...',
					addressLine1: 'Loading from IPFS...',
					city: '',
					state: '',
					postalCode: '',
					country: ''
				};
			}

			const request: ProductRequest = {
				id: requestData.requestId || 'unknown',
				productId: requestData.productId || '',
				consumerId: requestData.consumerId || currentUserAddress,
				consumerName: 'You', // Consumer viewing their own requests
				manufacturerId: requestData.manufacturerId || '',
				manufacturerName: requestData.manufacturerId || 'Unknown Manufacturer',
				quantity:
					typeof requestData.quantity === 'string'
						? parseInt(requestData.quantity)
						: requestData.quantity || 1,
				requestedAt: requestData.requestedAt || Date.now().toString(),
				status:
					requestData.status === 'pending' ||
					requestData.status === 'approved' ||
					requestData.status === 'rejected' ||
					requestData.status === 'fulfilled'
						? requestData.status
						: 'pending',
				shippingAddress,
				message: requestData.message || '',
				rejectionReason: requestData.rejectionReason
			};

			requests.push(request);
		}

		console.log('✅ Retrieved', requests.length, 'consumer requests from blockchain');
		console.log('📊 Consumer requests status breakdown:', {
			pending: requests.filter((r) => r.status === 'pending').length,
			approved: requests.filter((r) => r.status === 'approved').length,
			rejected: requests.filter((r) => r.status === 'rejected').length,
			fulfilled: requests.filter((r) => r.status === 'fulfilled').length
		});

		return requests;
	} catch (error) {
		console.error('Error fetching consumer requests:', error);
		throw new Error('Failed to load your product requests');
	}
}

/**
 * Debug function to check current marketplace state
 */
export async function debugMarketplaceState(currentUserAddress?: string): Promise<{
	userAddress: string;
	allRequests: ProductRequest[];
	userRequests: ProductRequest[];
	allProducts: Product[];
	userProducts: Product[];
}> {
	const userAddress = currentUserAddress || (await getUserAddress());

	console.log('=== MARKETPLACE DEBUG (BLOCKCHAIN VERSION) ===');
	console.log('Current user address:', userAddress);

	// Get requests from blockchain
	const requests = await getPendingRequests(userAddress);
	console.log('Requests for this user:', requests);

	// Also check available products
	const products = await getManufacturerProducts();
	console.log('Available products:', products);
	console.log(
		'Products by this manufacturer:',
		products.filter((p) => p.manufacturer === userAddress)
	);

	return {
		userAddress,
		allRequests: requests,
		userRequests: requests,
		allProducts: products,
		userProducts: products.filter((p) => p.manufacturer === userAddress)
	};
}
