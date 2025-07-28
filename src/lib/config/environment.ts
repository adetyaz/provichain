import {
	PUBLIC_PINATA_API_KEY,
	PUBLIC_PINATA_SECRET_KEY,
	PUBLIC_PINATA_GATEWAY,
	PUBLIC_ACCESS_CONTROL_ADDRESS,
	PUBLIC_PRODUCT_REGISTRY_ADDRESS,
	PUBLIC_PARTICIPANT_REGISTRY_ADDRESS,
	PUBLIC_DID_REGISTRY_ADDRESS,
	PUBLIC_BLOCKCHAIN_NETWORK,
	PUBLIC_GAS_LIMIT_DEFAULT,
	PUBLIC_COIN_AMOUNT_DEFAULT
} from '$env/static/public';

// Environment configuration for ProviChain
export const CONFIG = {
	// Pinata IPFS Configuration
	pinata: {
		apiKey: PUBLIC_PINATA_API_KEY,
		secretKey: PUBLIC_PINATA_SECRET_KEY,
		gateway: PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
		baseUrl: 'https://api.pinata.cloud'
	},

	// Smart Contract Addresses
	contracts: {
		accessControl: PUBLIC_ACCESS_CONTROL_ADDRESS,
		productRegistry: PUBLIC_PRODUCT_REGISTRY_ADDRESS,
		participantRegistry: PUBLIC_PARTICIPANT_REGISTRY_ADDRESS,
		didRegistry: PUBLIC_DID_REGISTRY_ADDRESS
	},

	// Blockchain Configuration
	blockchain: {
		network: PUBLIC_BLOCKCHAIN_NETWORK || 'buildnet',
		gasLimitDefault: BigInt(PUBLIC_GAS_LIMIT_DEFAULT || '30000000'),
		coinAmountDefault: PUBLIC_COIN_AMOUNT_DEFAULT || '0.1'
	}
};

// Validation to ensure all required env vars are present
export function validateConfig() {
	const requiredValues = {
		PUBLIC_PINATA_API_KEY,
		PUBLIC_PINATA_SECRET_KEY,
		PUBLIC_ACCESS_CONTROL_ADDRESS,
		PUBLIC_PRODUCT_REGISTRY_ADDRESS,
		PUBLIC_PARTICIPANT_REGISTRY_ADDRESS,
		PUBLIC_DID_REGISTRY_ADDRESS
	};

	const missing = Object.entries(requiredValues)
		.filter(([, value]) => !value)
		.map(([key]) => key);

	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}
}

// Helper to check if we're in development mode
export const isDev = process.env.NODE_ENV === 'development';

export default CONFIG;
