// User service for role management and user operations
import { Args, Mas } from '@massalabs/massa-web3';
import { getWeb3Provider, getAccessControlContract } from '$lib/blockchain/provider';

// Check if user has specific role
export async function checkUserRole(roleName: string): Promise<boolean> {
	try {
		const provider = await getWeb3Provider();
		const accessControl = await getAccessControlContract();

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
		const accessControl = await getAccessControlContract();

		const operation = await accessControl.call(
			'requestRole',
			new Args().addString(roleName).addString(justification).serialize(),
			{
				coins: Mas.fromString('0.01')
			}
		);

		await operation.waitSpeculativeExecution();
		return { success: true, operationId: operation.id };
	} catch (error) {
		console.error('Role request failed:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
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
				console.log(`✅ User has role: ${result}`);
				return result;
			}
		}

		console.log('⚠️ No role assigned to user');
		return null;
	} catch (error) {
		console.error('Error getting user role:', error);
		return null;
	}
}

// Get products owned by user (consumer)
export async function getUserProducts(userAddress: string) {
	try {
		// In a real implementation, this would query the blockchain for products owned by the user
		// For now, return mock data that matches the consumer dashboard format
		const mockProducts = [
			{
				id: 'PVC-2025-001',
				name: 'Premium Organic Coffee',
				manufacturer: 'Sustainable Farms Co.',
				status: 'Delivered',
				purchaseDate: '2025-02-10',
				deliveryDate: '2025-02-16',
				quality: 'Excellent',
				value: '$125.00',
				owner: userAddress
			},
			{
				id: 'PVC-2025-007',
				name: 'Swiss Artisan Chocolate',
				manufacturer: 'Alpine Confections',
				status: 'Consumed',
				purchaseDate: '2025-01-25',
				deliveryDate: '2025-01-30',
				quality: 'Perfect',
				value: '$89.99',
				owner: userAddress
			},
			{
				id: 'PVC-2025-012',
				name: 'Organic Tea Collection',
				manufacturer: 'Mountain Tea Co.',
				status: 'In Use',
				purchaseDate: '2025-02-01',
				deliveryDate: '2025-02-05',
				quality: 'Excellent',
				value: '$67.50',
				owner: userAddress
			}
		];

		return mockProducts;
	} catch (error) {
		console.error('Error getting user products:', error);
		return [];
	}
}
