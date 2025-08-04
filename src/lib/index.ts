// Main entry point for ProviChain library modules
// This file exports all the modularized functionality

// Configuration
export { CONFIG, validateConfig, isDev } from './config/environment';

// Blockchain Provider
export {
	getWeb3Provider,
	getUserAddress,
	testContractConnection,
	getProductRegistryContract,
	getAccessControlContract,
	getParticipantRegistryContract,
	getDIDRegistryContract
} from './provider/provider';

// IPFS/Pinata Services
export {
	uploadMetadataToPinata,
	getMetadataFromPinata,
	uploadImageToPinata,
	listProductFiles,
	listProductsByManufacturer
} from './ipfs/pinata-client';

// Product Services
export {
	mintProduct,
	getProduct,
	getProducts,
	getManufacturerProducts,
	getProductById,
	updateProductMetadata,
	testGetSpecificProduct
} from './services/product-service';

// User Services
export { checkUserRole, requestRole, getUserRole, getUserProducts } from './services/user-service';

// Inventory Services
export {
	getInventoryOverview,
	getInventoryStats,
	getInventoryAlerts,
	updateStock,
	getStockHistory,
	setReorderPoint,
	generateInventoryReport
} from './services/inventory-service';

// Marketplace Services
export {
	getAvailableProducts,
	getAllProductRequests,
	requestProduct,
	getPendingRequests,
	approveProductRequest,
	rejectProductRequest
} from './services/marketplace-service';

// Workflow Services
export {
	createShipmentRequest,
	getShipmentRequests,
	assignLogisticsProvider,
	updateShipmentStatus,
	confirmDelivery,
	getWorkflowStatus
} from './services/workflow-service';

// System Services
export {
	getSystemStats,
	getMyProductRequests,
	getMyShipments,
	trackDelivery,
	searchProducts
} from './services/system-service';

export type { InventoryItem, InventoryAlert, InventoryStats } from './services/inventory-service';

// Types
export type * from './types';
