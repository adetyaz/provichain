// Massa Web3 integration for frontend
import { Args, SmartContract, Mas, Account, Web3Provider } from '@massalabs/massa-web3';
import { getWallets } from '@massalabs/wallet-provider';
import { uploadMetadataToPinata, type ProductMetadata } from './pinata';

// Contract addresses from deployed contracts
export const CONTRACT_ADDRESSES = {
	ACCESS_CONTROL: 'AS12JiKF6YLc2eQCYdvZuybvXoHM38obVqCPRRcF1awznuafPNCBN',
	PRODUCT_REGISTRY: 'AS12vUD4mNekXaDdzg7tTYHqsWDMCUUsGdwMnnApdDrFiHKpGRjVo',
	PARTICIPANT_REGISTRY: 'AS12jqeC36vTEEQjYK6h7WJi83HMQDLQATkqpnScy6NqVC48nbGR8',
	DID_REGISTRY: 'AS1JMsReetZg6c5Eqmen6X5oEuv69d1V66oLNM2yHyuXUiagLjjt',
	QUALITY_MONITORING: 'AS12WCbVDtnRkJvaZ2cNXTAzKRvojRTAsg5ZdTDhDkW4VWS8LeCmD',
	LOGISTICS_TRACKING: 'AS1EJ36nhvaz8awRjthLQGFtaTVMkR9ANQYksFUSeVy9npUwf9PL'
};

// Get user's web3 provider (with wallet provider integration)
export async function getWeb3Provider() {
	try {
		// Try to get available wallets
		const wallets = await getWallets(200);

		if (wallets.length > 0) {
			const wallet = wallets[0]; // Use first available wallet
			await wallet.connect();
			const accounts = await wallet.accounts();

			if (accounts.length > 0) {
				return accounts[0]; // Return the first account as provider
			}
		}

		// Fallback: Use a demo account for testing
		console.warn('No wallet found, using demo account');
		const demoSecretKey = 'S1VbYEMRJB5zREuLjfYbPKNd8cCHNZPmyzw78lGJbmgvGfHLvdp';
		const account = await Account.fromPrivateKey(demoSecretKey);
		return Web3Provider.buildnet(account);
	} catch (error) {
		console.error('Failed to get provider:', error);
		// Fallback to demo account
		const demoSecretKey = 'S1VbYEMRJB5zREuLjfYbPKNd8cCHNZPmyzw78lGJbmgvGfHLvdp';
		const account = await Account.fromPrivateKey(demoSecretKey);
		return Web3Provider.buildnet(account);
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

// Mint a new product (Manufacturer only)
export async function mintProduct(productData: {
	id: string;
	name: string;
	batch: string;
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
					trait_type: 'Manufacturer',
					value: provider.address
				},
				{
					trait_type: 'Category',
					value: productData.category || 'Unknown'
				}
			],
			// ASC Configuration in metadata
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
		console.log('Metadata uploaded to IPFS:', ipfsHash);

		const operation = await productRegistry.call(
			'mintProduct',
			new Args()
				.addString(productData.id)
				.addString(productData.name)
				.addString(productData.batch)
				.addString(ipfsHash) // Use IPFS hash as metadata
				.serialize(),
			{
				coins: Mas.fromString('0.01')
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
		return { success: false, error: error instanceof Error ? error.message : String(error) };
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
		const roles = ['manufacturer', 'logistics', 'consumer', 'admin'];
		for (const role of roles) {
			const hasRole = await checkUserRole(role);
			if (hasRole) return role;
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

// Quality Monitoring Smart Contract Functions
export async function getQualityData(productId: string) {
	try {
		const provider = await getWeb3Provider();
		const qualityContract = new SmartContract(provider, CONTRACT_ADDRESSES.QUALITY_MONITORING);

		const response = await qualityContract.read(
			'getQualityData',
			new Args().addString(productId).serialize()
		);

		const result = new TextDecoder().decode(response.value);
		return JSON.parse(result);
	} catch (error) {
		console.warn('Quality data not found, using mock data:', error);
		// Return mock data for demo
		return {
			temperature: Math.floor(Math.random() * 10) + 20 + '°C',
			humidity: Math.floor(Math.random() * 20) + 50 + '%',
			lastUpdate: new Date().toLocaleString(),
			status: 'Normal',
			alerts: []
		};
	}
}

export async function updateQualityData(productId: string, temperature: number, humidity: number) {
	try {
		const provider = await getWeb3Provider();
		const qualityContract = new SmartContract(provider, CONTRACT_ADDRESSES.QUALITY_MONITORING);

		await qualityContract.call(
			'updateQualityData',
			new Args()
				.addString(productId)
				.addI32(BigInt(Math.floor(temperature)))
				.addI32(BigInt(Math.floor(humidity)))
				.serialize(),
			{ fee: Mas.fromString('0.1') }
		);

		return { success: true, message: 'Quality data updated successfully' };
	} catch (error) {
		console.error('Error updating quality data:', error);
		return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function setQualityThresholds(
	productId: string,
	tempThreshold: number,
	humidityThreshold: number
) {
	try {
		const provider = await getWeb3Provider();
		const qualityContract = new SmartContract(provider, CONTRACT_ADDRESSES.QUALITY_MONITORING);

		await qualityContract.call(
			'setQualityThresholds',
			new Args()
				.addString(productId)
				.addI32(BigInt(Math.floor(tempThreshold)))
				.addI32(BigInt(Math.floor(humidityThreshold)))
				.serialize(),
			{ fee: Mas.fromString('0.1') }
		);

		return { success: true, message: 'Quality thresholds set successfully' };
	} catch (error) {
		console.error('Error setting quality thresholds:', error);
		return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
	}
}

// Logistics Tracking Smart Contract Functions
export async function getLocationData(productId: string) {
	try {
		const provider = await getWeb3Provider();
		const logisticsContract = new SmartContract(provider, CONTRACT_ADDRESSES.LOGISTICS_TRACKING);

		const response = await logisticsContract.read(
			'getCurrentLocation',
			new Args().addString(productId).serialize()
		);

		const result = new TextDecoder().decode(response.value);
		return JSON.parse(result);
	} catch (error) {
		console.warn('Location data not found, using mock data:', error);
		// Return mock data for demo
		return {
			currentLocation: 'New York Distribution Center',
			latitude: 40.7128,
			longitude: -74.006,
			lastUpdate: new Date().toLocaleString(),
			status: 'In Transit',
			estimatedDelivery: '2025-07-25'
		};
	}
}

export async function updateLocation(
	productId: string,
	location: string,
	latitude: number,
	longitude: number
) {
	try {
		const provider = await getWeb3Provider();
		const logisticsContract = new SmartContract(provider, CONTRACT_ADDRESSES.LOGISTICS_TRACKING);

		await logisticsContract.call(
			'updateLocation',
			new Args()
				.addString(productId)
				.addString(location)
				.addString(latitude.toString())
				.addString(longitude.toString())
				.serialize(),
			{ fee: Mas.fromString('0.1') }
		);

		return { success: true, message: 'Location updated successfully' };
	} catch (error) {
		console.error('Error updating location:', error);
		return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function createShipment(
	productId: string,
	origin: string,
	destination: string,
	carrier: string
) {
	try {
		const provider = await getWeb3Provider();
		const logisticsContract = new SmartContract(provider, CONTRACT_ADDRESSES.LOGISTICS_TRACKING);

		await logisticsContract.call(
			'createShipment',
			new Args()
				.addString(productId)
				.addString(origin)
				.addString(destination)
				.addString(carrier)
				.serialize(),
			{ fee: Mas.fromString('0.1') }
		);

		return { success: true, message: 'Shipment created successfully' };
	} catch (error) {
		console.error('Error creating shipment:', error);
		return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function updateShipmentStatus(productId: string, status: string) {
	try {
		const provider = await getWeb3Provider();
		const logisticsContract = new SmartContract(provider, CONTRACT_ADDRESSES.LOGISTICS_TRACKING);

		await logisticsContract.call(
			'updateShipmentStatus',
			new Args().addString(productId).addString(status).serialize(),
			{ fee: Mas.fromString('0.1') }
		);

		return { success: true, message: 'Shipment status updated successfully' };
	} catch (error) {
		console.error('Error updating shipment status:', error);
		return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function confirmDelivery(productId: string, recipientAddress: string) {
	try {
		const provider = await getWeb3Provider();
		const logisticsContract = new SmartContract(provider, CONTRACT_ADDRESSES.LOGISTICS_TRACKING);

		await logisticsContract.call(
			'confirmDelivery',
			new Args().addString(productId).addString(recipientAddress).serialize(),
			{ fee: Mas.fromString('0.1') }
		);

		return { success: true, message: 'Delivery confirmed successfully' };
	} catch (error) {
		console.error('Error confirming delivery:', error);
		return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
	}
}
