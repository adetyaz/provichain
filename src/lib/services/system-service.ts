// System administration and statistics service
import { getManufacturerProducts } from '$lib/web3';
import { getAllProductRequests } from './marketplace-service';
import { getShipmentRequests } from './workflow-service';

export interface SystemStats {
	totalUsers: number;
	totalProducts: number;
	manufacturers: number;
	consumers: number;
	logistics: number;
	todayVerifications: number;
	newProducts: number;
}

// Get real system statistics from various services
export async function getSystemStats(): Promise<SystemStats> {
	try {
		// Get real data from services
		const [products, requests, shipments] = await Promise.all([
			getManufacturerProducts().catch(() => []),
			getAllProductRequests().catch(() => []),
			getShipmentRequests().catch(() => [])
		]);

		// Calculate statistics from real data
		const totalProducts = products.length;

		// Count unique users by addresses (simplified)
		const uniqueConsumers = new Set(requests.map((r) => r.consumerId)).size;
		const uniqueManufacturers = new Set(products.map((p) => p.manufacturer)).size;
		const uniqueLogistics = new Set(
			shipments.filter((s) => s.assignedLogisticsId).map((s) => s.assignedLogisticsId)
		).size;

		// Calculate today's activity
		const today = new Date().toDateString();
		const todayRequests = requests.filter(
			(r) => new Date(r.requestedAt).toDateString() === today
		).length;

		// Calculate this month's new products
		const thisMonth = new Date().getMonth();
		const thisYear = new Date().getFullYear();
		const newProducts = products.filter((p) => {
			const productDate = new Date(p.mintedAt);
			return productDate.getMonth() === thisMonth && productDate.getFullYear() === thisYear;
		}).length;

		return {
			totalUsers: uniqueConsumers + uniqueManufacturers + uniqueLogistics,
			totalProducts,
			manufacturers: uniqueManufacturers,
			consumers: uniqueConsumers,
			logistics: uniqueLogistics,
			todayVerifications: todayRequests,
			newProducts
		};
	} catch (error) {
		console.error('Failed to get system stats:', error);
		// Return empty stats if there's an error
		return {
			totalUsers: 0,
			totalProducts: 0,
			manufacturers: 0,
			consumers: 0,
			logistics: 0,
			todayVerifications: 0,
			newProducts: 0
		};
	}
}

// Get user-specific product requests
export async function getMyProductRequests(userId: string) {
	try {
		const requests = await getAllProductRequests();
		return requests.filter((request) => request.consumerId === userId);
	} catch (error) {
		console.error('Failed to get user product requests:', error);
		return [];
	}
}

// Get user-specific shipments
export async function getMyShipments(userId: string) {
	try {
		const shipments = await getShipmentRequests();
		return shipments.filter(
			(shipment) => shipment.consumerId === userId || shipment.assignedLogisticsId === userId
		);
	} catch (error) {
		console.error('Failed to get user shipments:', error);
		return [];
	}
}

// Track delivery status for a specific shipment
export async function trackDelivery(shipmentId: string) {
	try {
		const shipments = await getShipmentRequests();
		const shipment = shipments.find((s) => s.id === shipmentId);

		if (!shipment) {
			return { success: false, error: 'Shipment not found' };
		}

		return {
			success: true,
			data: {
				...shipment,
				trackingHistory: [
					{
						date: shipment.requestedAt,
						status: 'Request Created',
						location: 'Origin'
					},
					...(shipment.status === 'in_transit' || shipment.status === 'delivered'
						? [
								{
									date: new Date().toISOString(),
									status: 'In Transit',
									location: 'Distribution Center'
								}
							]
						: []),
					...(shipment.status === 'delivered'
						? [
								{
									date: new Date().toISOString(),
									status: 'Delivered',
									location: 'Destination'
								}
							]
						: [])
				]
			}
		};
	} catch (error) {
		console.error('Failed to track delivery:', error);
		return { success: false, error: 'Failed to track delivery' };
	}
}

// Search functionality that should be in product service
export async function searchProducts(query: string) {
	// Use existing getAvailableProducts and filter
	const { getAvailableProducts } = await import('./marketplace-service');
	const products = await getAvailableProducts();

	return products.filter(
		(product) =>
			product.name.toLowerCase().includes(query.toLowerCase()) ||
			product.description.toLowerCase().includes(query.toLowerCase())
	);
}
