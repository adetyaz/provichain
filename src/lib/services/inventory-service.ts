// Inventory management service
import type { Product } from '$lib/types';
import { getManufacturerProducts } from './product-service';

export interface InventoryItem {
	productId: string;
	name: string;
	category: string;
	currentStock: number;
	totalMinted: number;
	sold: number;
	inTransit: number;
	lowStockThreshold: number;
	status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstocked';
	lastUpdated: string;
	reorderPoint?: number;
	maxStock?: number;
	supplier?: string;
	cost?: number;
	price?: number;
}

export interface InventoryAlert {
	id: string;
	type: 'low-stock' | 'out-of-stock' | 'overstock' | 'expiring';
	productId: string;
	productName: string;
	message: string;
	severity: 'high' | 'medium' | 'low';
	createdAt: string;
}

export interface InventoryStats {
	totalProducts: number;
	totalStock: number;
	lowStockItems: number;
	outOfStockItems: number;
	totalValue: number;
	turnoverRate?: number;
}

// Get inventory overview for a manufacturer
export async function getInventoryOverview(manufacturerAddress?: string): Promise<InventoryItem[]> {
	try {
		const products = await getManufacturerProducts(manufacturerAddress);

		// Convert products to inventory items
		const inventoryItems: InventoryItem[] = products.map((product) => {
			// For now, use the minted quantity as total stock
			// In a real implementation, this would track actual stock levels
			const currentStock = product.quantity;
			const lowStockThreshold = Math.max(Math.floor(product.quantity * 0.2), 1);

			let status: InventoryItem['status'] = 'in-stock';
			if (currentStock === 0) {
				status = 'out-of-stock';
			} else if (currentStock <= lowStockThreshold) {
				status = 'low-stock';
			} else if (currentStock > product.quantity * 1.5) {
				status = 'overstocked';
			}

			return {
				productId: product.id,
				name: product.name,
				category: product.category,
				currentStock: currentStock,
				totalMinted: product.quantity,
				sold: 0, // TODO: Track actual sales
				inTransit: 0, // TODO: Track transfers
				lowStockThreshold: lowStockThreshold,
				status: status,
				lastUpdated: product.mintedAt,
				reorderPoint: lowStockThreshold,
				maxStock: product.quantity * 2
			};
		});

		return inventoryItems;
	} catch (error) {
		console.error('Error getting inventory overview:', error);
		return [];
	}
}

// Get inventory statistics
export async function getInventoryStats(manufacturerAddress?: string): Promise<InventoryStats> {
	try {
		const inventory = await getInventoryOverview(manufacturerAddress);

		const stats: InventoryStats = {
			totalProducts: inventory.length,
			totalStock: inventory.reduce((sum, item) => sum + item.currentStock, 0),
			lowStockItems: inventory.filter((item) => item.status === 'low-stock').length,
			outOfStockItems: inventory.filter((item) => item.status === 'out-of-stock').length,
			totalValue: inventory.reduce((sum, item) => {
				// Estimate value if price is available, otherwise use arbitrary value
				const itemValue = item.price || 100; // Default $100 per item
				return sum + item.currentStock * itemValue;
			}, 0)
		};

		return stats;
	} catch (error) {
		console.error('Error getting inventory stats:', error);
		return {
			totalProducts: 0,
			totalStock: 0,
			lowStockItems: 0,
			outOfStockItems: 0,
			totalValue: 0
		};
	}
}

// Get inventory alerts
export async function getInventoryAlerts(manufacturerAddress?: string): Promise<InventoryAlert[]> {
	try {
		const inventory = await getInventoryOverview(manufacturerAddress);
		const alerts: InventoryAlert[] = [];

		inventory.forEach((item) => {
			if (item.status === 'out-of-stock') {
				alerts.push({
					id: `alert-${item.productId}-out-of-stock`,
					type: 'out-of-stock',
					productId: item.productId,
					productName: item.name,
					message: `${item.name} is out of stock`,
					severity: 'high',
					createdAt: new Date().toISOString()
				});
			} else if (item.status === 'low-stock') {
				alerts.push({
					id: `alert-${item.productId}-low-stock`,
					type: 'low-stock',
					productId: item.productId,
					productName: item.name,
					message: `${item.name} is running low (${item.currentStock} remaining)`,
					severity: 'medium',
					createdAt: new Date().toISOString()
				});
			} else if (item.status === 'overstocked') {
				alerts.push({
					id: `alert-${item.productId}-overstock`,
					type: 'overstock',
					productId: item.productId,
					productName: item.name,
					message: `${item.name} is overstocked (${item.currentStock} items)`,
					severity: 'low',
					createdAt: new Date().toISOString()
				});
			}
		});

		return alerts.sort((a, b) => {
			// Sort by severity: high > medium > low
			const severityOrder = { high: 3, medium: 2, low: 1 };
			return severityOrder[b.severity] - severityOrder[a.severity];
		});
	} catch (error) {
		console.error('Error getting inventory alerts:', error);
		return [];
	}
}

// Update stock levels (for when products are sold or transferred)
export async function updateStock(productId: string, change: number, reason: string) {
	try {
		// In a real implementation, this would update the blockchain or database
		// For now, we'll use localStorage to track stock changes
		const stockKey = `stock-changes-${productId}`;
		const existingChanges = localStorage.getItem(stockKey);
		let changes = [];

		if (existingChanges) {
			try {
				changes = JSON.parse(existingChanges);
			} catch {
				changes = [];
			}
		}

		changes.push({
			change: change,
			reason: reason,
			timestamp: new Date().toISOString()
		});

		localStorage.setItem(stockKey, JSON.stringify(changes));

		console.log(`✅ Stock updated for ${productId}: ${change > 0 ? '+' : ''}${change} (${reason})`);

		return { success: true };
	} catch (error) {
		console.error('Error updating stock:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}

// Get stock change history for a product
export async function getStockHistory(productId: string) {
	try {
		const stockKey = `stock-changes-${productId}`;
		const storedChanges = localStorage.getItem(stockKey);

		if (storedChanges) {
			return JSON.parse(storedChanges);
		}

		return [];
	} catch (error) {
		console.error('Error getting stock history:', error);
		return [];
	}
}

// Set reorder point for a product
export async function setReorderPoint(productId: string, reorderPoint: number) {
	try {
		const configKey = `product-config-${productId}`;
		const existingConfig = localStorage.getItem(configKey);
		let config = {};

		if (existingConfig) {
			try {
				config = JSON.parse(existingConfig);
			} catch {
				config = {};
			}
		}

		config = { ...config, reorderPoint };
		localStorage.setItem(configKey, JSON.stringify(config));

		console.log(`✅ Reorder point set for ${productId}: ${reorderPoint}`);

		return { success: true };
	} catch (error) {
		console.error('Error setting reorder point:', error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}

// Generate inventory report
export async function generateInventoryReport(manufacturerAddress?: string) {
	try {
		const inventory = await getInventoryOverview(manufacturerAddress);
		const stats = await getInventoryStats(manufacturerAddress);
		const alerts = await getInventoryAlerts(manufacturerAddress);

		const report = {
			generatedAt: new Date().toISOString(),
			manufacturerAddress: manufacturerAddress,
			summary: stats,
			inventory: inventory,
			alerts: alerts,
			recommendations: generateRecommendations(inventory)
		};

		return report;
	} catch (error) {
		console.error('Error generating inventory report:', error);
		return null;
	}
}

// Generate recommendations based on inventory data
function generateRecommendations(inventory: InventoryItem[]): string[] {
	const recommendations: string[] = [];

	const lowStockItems = inventory.filter((item) => item.status === 'low-stock');
	const outOfStockItems = inventory.filter((item) => item.status === 'out-of-stock');
	const overstockedItems = inventory.filter((item) => item.status === 'overstocked');

	if (outOfStockItems.length > 0) {
		recommendations.push(
			`Immediate action needed: ${outOfStockItems.length} products are out of stock`
		);
	}

	if (lowStockItems.length > 0) {
		recommendations.push(`Consider reordering: ${lowStockItems.length} products are running low`);
	}

	if (overstockedItems.length > 0) {
		recommendations.push(
			`Review stocking strategy: ${overstockedItems.length} products are overstocked`
		);
	}

	if (inventory.length === 0) {
		recommendations.push('Start by minting your first products to build your inventory');
	}

	return recommendations;
}
