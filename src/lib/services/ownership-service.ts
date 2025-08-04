import { Args, SmartContract } from '@massalabs/massa-web3';
import { getWeb3Provider } from '$lib/provider/provider';
import { CONTRACT_ADDRESSES } from '$lib/web3';

export interface OwnershipRecord {
	productId: string;
	currentOwner: string;
	previousOwner?: string;
	transferDate: Date;
	transactionId: string;
	transferType: 'purchase' | 'gift' | 'return' | 'warranty';
	status: 'pending' | 'completed' | 'failed';
}

export interface TransferRequest {
	productId: string;
	fromAddress: string;
	toAddress: string;
	transferType: 'purchase' | 'gift' | 'return' | 'warranty';
	price?: number;
	notes?: string;
}

export class OwnershipService {
	private contractAddress = CONTRACT_ADDRESSES.PRODUCT_REGISTRY; // Using existing registry for now

	/**
	 * Check if user owns a specific product
	 */
	async checkProductOwnership(productId: string, userAddress: string): Promise<boolean> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			const args = new Args().addString(productId).addString(userAddress).serialize();

			const result = await contract.read('checkOwnership', args);
			const response = new TextDecoder().decode(result.value);
			return response === 'true';
		} catch (error) {
			console.error('Error checking product ownership:', error);
			return false;
		}
	}

	/**
	 * Get current owner of a product
	 */
	async getCurrentOwner(productId: string): Promise<string | null> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			const args = new Args().addString(productId).serialize();

			const result = await contract.read('getCurrentOwner', args);
			const response = new TextDecoder().decode(result.value);
			return response || null;
		} catch (error) {
			console.error('Error getting current owner:', error);
			return null;
		}
	}

	/**
	 * Get ownership history for a product
	 */
	async getOwnershipHistory(productId: string): Promise<OwnershipRecord[]> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			const args = new Args().addString(productId).serialize();

			const result = await contract.read('getOwnershipHistory', args);
			const response = new TextDecoder().decode(result.value);

			if (response) {
				const historyData = JSON.parse(response);
				return historyData.map((record: OwnershipRecord) => ({
					...record,
					transferDate: new Date(record.transferDate)
				}));
			}

			return [];
		} catch (error) {
			console.error('Error getting ownership history:', error);
			return [];
		}
	}

	/**
	 * Get all products owned by a user
	 */
	async getUserOwnedProducts(userAddress: string): Promise<string[]> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			const args = new Args().addString(userAddress).serialize();

			const result = await contract.read('getUserOwnedProducts', args);
			const response = new TextDecoder().decode(result.value);

			if (response) {
				return JSON.parse(response);
			}

			return [];
		} catch (error) {
			console.error('Error getting user owned products:', error);
			return [];
		}
	}

	/**
	 * Initiate product ownership transfer
	 */
	async initiateTransfer(transferRequest: TransferRequest): Promise<string | null> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			// Check if user owns the product first
			const isOwner = await this.checkProductOwnership(
				transferRequest.productId,
				transferRequest.fromAddress
			);
			if (!isOwner) {
				throw new Error('User does not own this product');
			}

			// Prepare transfer arguments
			const args = new Args()
				.addString(transferRequest.productId)
				.addString(transferRequest.fromAddress)
				.addString(transferRequest.toAddress)
				.addString(transferRequest.transferType)
				.addU64(BigInt(transferRequest.price || 0))
				.addString(transferRequest.notes || '')
				.serialize();

			// Execute transfer transaction
			const operation = await contract.call('transferOwnership', args, {
				maxGas: BigInt(1000000),
				fee: BigInt(100000000) // 0.1 MAS
			});

			console.log('Transfer initiated:', operation);
			return operation.id;
		} catch (error) {
			console.error('Error initiating transfer:', error);
			throw error;
		}
	}

	/**
	 * Get pending transfers for a user
	 */
	async getPendingTransfers(userAddress: string): Promise<OwnershipRecord[]> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			const args = new Args().addString(userAddress).serialize();

			const result = await contract.read('getPendingTransfers', args);
			const response = new TextDecoder().decode(result.value);

			if (response) {
				const transfersData = JSON.parse(response);
				return transfersData.map((record: OwnershipRecord) => ({
					...record,
					transferDate: new Date(record.transferDate)
				}));
			}

			return [];
		} catch (error) {
			console.error('Error getting pending transfers:', error);
			return [];
		}
	}

	/**
	 * Accept a pending transfer (for recipient)
	 */
	async acceptTransfer(productId: string, transferId: string): Promise<string | null> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			const args = new Args().addString(productId).addString(transferId).serialize();

			const operation = await contract.call('acceptTransfer', args, {
				maxGas: BigInt(500000),
				fee: BigInt(50000000) // 0.05 MAS
			});

			console.log('Transfer accepted:', operation);
			return operation.id;
		} catch (error) {
			console.error('Error accepting transfer:', error);
			throw error;
		}
	}

	/**
	 * Cancel a pending transfer (for sender)
	 */
	async cancelTransfer(productId: string, transferId: string): Promise<string | null> {
		try {
			const provider = await getWeb3Provider();
			const contract = new SmartContract(provider, this.contractAddress);

			const args = new Args().addString(productId).addString(transferId).serialize();

			const operation = await contract.call('cancelTransfer', args, {
				maxGas: BigInt(300000),
				fee: BigInt(30000000) // 0.03 MAS
			});

			console.log('Transfer cancelled:', operation);
			return operation.id;
		} catch (error) {
			console.error('Error cancelling transfer:', error);
			throw error;
		}
	}

	/**
	 * Calculate transfer fees
	 */
	calculateTransferFee(transferType: string, productValue?: number): number {
		const baseFee = 0.1; // 0.1 MAS base fee

		switch (transferType) {
			case 'purchase':
				return baseFee + (productValue ? productValue * 0.025 : 0); // 2.5% of value
			case 'gift':
				return baseFee;
			case 'return':
				return baseFee * 0.5; // 50% reduction for returns
			case 'warranty':
				return 0; // No fee for warranty transfers
			default:
				return baseFee;
		}
	}

	/**
	 * Validate transfer request
	 */
	validateTransferRequest(transferRequest: TransferRequest): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!transferRequest.productId) {
			errors.push('Product ID is required');
		}

		if (!transferRequest.fromAddress) {
			errors.push('From address is required');
		}

		if (!transferRequest.toAddress) {
			errors.push('To address is required');
		}

		if (transferRequest.fromAddress === transferRequest.toAddress) {
			errors.push('Cannot transfer to the same address');
		}

		if (!['purchase', 'gift', 'return', 'warranty'].includes(transferRequest.transferType)) {
			errors.push('Invalid transfer type');
		}

		if (transferRequest.transferType === 'purchase' && !transferRequest.price) {
			errors.push('Price is required for purchase transfers');
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}
}

// Create singleton instance
export const ownershipService = new OwnershipService();
