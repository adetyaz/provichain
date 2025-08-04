/**
 * Workflow Service
 * Handles cross-role workflows and supply chain orchestration
 */

import { getUserAddress } from '../provider/provider';

// Types for workflow management
export interface ShipmentRequest {
	id: string;
	productId: string;
	productName: string;
	manufacturerId: string;
	manufacturerName: string;
	consumerId: string;
	consumerName: string;
	requestedAt: string;
	status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'confirmed';
	assignedLogisticsId?: string;
	assignedLogisticsName?: string;
	assignedAt?: string;
	pickupLocation: string;
	deliveryLocation: string;
	estimatedDelivery?: string;
	actualDelivery?: string;
	trackingUpdates: TrackingUpdate[];
	priority: 'low' | 'normal' | 'high' | 'urgent';
	specialInstructions?: string;
}

export interface TrackingUpdate {
	id: string;
	timestamp: string;
	location: string;
	status: string;
	notes?: string;
	updatedBy: string;
	coordinates?: { lat: number; lng: number };
}

export interface WorkflowStatus {
	productRequests: {
		pending: number;
		approved: number;
		rejected: number;
	};
	shipments: {
		pending: number;
		in_transit: number;
		delivered: number;
	};
	logistics: {
		active_providers: number;
		avg_delivery_time: string;
	};
}

// Mock storage (in production, this would be on-chain or database)
const shipmentRequests: ShipmentRequest[] = [];
// const trackingUpdates: TrackingUpdate[] = []; // Reserved for future use

/**
 * Create a shipment request (triggered after product request approval)
 */
export async function createShipmentRequest(
	productId: string,
	productName: string,
	manufacturerId: string,
	consumerId: string,
	pickupLocation: string,
	deliveryLocation: string,
	priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
	specialInstructions?: string
): Promise<{ success: boolean; shipmentId?: string; error?: string }> {
	try {
		const shipmentId = `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		const newShipment: ShipmentRequest = {
			id: shipmentId,
			productId,
			productName,
			manufacturerId,
			manufacturerName: `Manufacturer ${manufacturerId.slice(-6)}`,
			consumerId,
			consumerName: `Consumer ${consumerId.slice(-6)}`,
			requestedAt: new Date().toISOString(),
			status: 'pending',
			pickupLocation,
			deliveryLocation,
			priority,
			specialInstructions,
			trackingUpdates: []
		};

		shipmentRequests.push(newShipment);

		return { success: true, shipmentId };
	} catch (error) {
		console.error('Error creating shipment request:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to create shipment request'
		};
	}
}

/**
 * Get shipment requests (filtered by role)
 */
export async function getShipmentRequests(
	userAddress?: string,
	role?: string
): Promise<ShipmentRequest[]> {
	try {
		const currentUserAddress = userAddress || (await getUserAddress());

		if (role === 'logistics') {
			// Logistics providers see unassigned requests and their assigned shipments
			return shipmentRequests.filter(
				(req) => req.status === 'pending' || req.assignedLogisticsId === currentUserAddress
			);
		} else if (role === 'manufacturer') {
			// Manufacturers see their own shipment requests
			return shipmentRequests.filter((req) => req.manufacturerId === currentUserAddress);
		} else if (role === 'consumer') {
			// Consumers see their own deliveries
			return shipmentRequests.filter((req) => req.consumerId === currentUserAddress);
		} else {
			// Admin sees all shipments
			return [...shipmentRequests];
		}
	} catch (error) {
		console.error('Error fetching shipment requests:', error);
		throw new Error('Failed to load shipment requests');
	}
}

/**
 * Assign logistics provider to a shipment (admin action)
 */
export async function assignLogisticsProvider(
	shipmentId: string,
	logisticsProviderId: string,
	estimatedDelivery?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const shipmentIndex = shipmentRequests.findIndex((req) => req.id === shipmentId);

		if (shipmentIndex === -1) {
			return { success: false, error: 'Shipment not found' };
		}

		const shipment = shipmentRequests[shipmentIndex];

		if (shipment.status !== 'pending') {
			return { success: false, error: 'Shipment is no longer pending assignment' };
		}

		// Update shipment with logistics assignment
		shipmentRequests[shipmentIndex] = {
			...shipment,
			status: 'assigned',
			assignedLogisticsId: logisticsProviderId,
			assignedLogisticsName: `Logistics ${logisticsProviderId.slice(-6)}`,
			assignedAt: new Date().toISOString(),
			estimatedDelivery
		};

		// Add tracking update
		const trackingUpdate: TrackingUpdate = {
			id: `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
			timestamp: new Date().toISOString(),
			location: shipment.pickupLocation,
			status: 'Logistics provider assigned',
			notes: `Assigned to ${logisticsProviderId}`,
			updatedBy: 'system'
		};

		shipmentRequests[shipmentIndex].trackingUpdates.push(trackingUpdate);

		return { success: true };
	} catch (error) {
		console.error('Error assigning logistics provider:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to assign logistics provider'
		};
	}
}

/**
 * Update shipment status (logistics provider action)
 */
export async function updateShipmentStatus(
	shipmentId: string,
	newStatus: 'picked_up' | 'in_transit' | 'delivered',
	location: string,
	notes?: string,
	coordinates?: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string }> {
	try {
		const currentUserAddress = await getUserAddress();
		const shipmentIndex = shipmentRequests.findIndex((req) => req.id === shipmentId);

		if (shipmentIndex === -1) {
			return { success: false, error: 'Shipment not found' };
		}

		const shipment = shipmentRequests[shipmentIndex];

		// Verify logistics provider is assigned to this shipment
		if (shipment.assignedLogisticsId !== currentUserAddress) {
			return { success: false, error: 'You are not assigned to this shipment' };
		}

		// Update shipment status
		shipmentRequests[shipmentIndex] = {
			...shipment,
			status: newStatus,
			...(newStatus === 'delivered' && { actualDelivery: new Date().toISOString() })
		};

		// Add tracking update
		const trackingUpdate: TrackingUpdate = {
			id: `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
			timestamp: new Date().toISOString(),
			location,
			status: newStatus.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
			notes,
			updatedBy: currentUserAddress,
			coordinates
		};

		shipmentRequests[shipmentIndex].trackingUpdates.push(trackingUpdate);

		return { success: true };
	} catch (error) {
		console.error('Error updating shipment status:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to update shipment status'
		};
	}
}

/**
 * Confirm delivery (consumer action)
 */
export async function confirmDelivery(
	shipmentId: string,
	rating?: number,
	feedback?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const currentUserAddress = await getUserAddress();
		const shipmentIndex = shipmentRequests.findIndex((req) => req.id === shipmentId);

		if (shipmentIndex === -1) {
			return { success: false, error: 'Shipment not found' };
		}

		const shipment = shipmentRequests[shipmentIndex];

		// Verify consumer is the recipient
		if (shipment.consumerId !== currentUserAddress) {
			return { success: false, error: 'You are not the recipient of this shipment' };
		}

		if (shipment.status !== 'delivered') {
			return { success: false, error: 'Shipment has not been marked as delivered yet' };
		}

		// Update shipment to confirmed
		shipmentRequests[shipmentIndex] = {
			...shipment,
			status: 'confirmed'
		};

		// Add confirmation tracking update
		const trackingUpdate: TrackingUpdate = {
			id: `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
			timestamp: new Date().toISOString(),
			location: shipment.deliveryLocation,
			status: 'Delivery Confirmed',
			notes: feedback ? `Consumer feedback: ${feedback}` : 'Delivery confirmed by consumer',
			updatedBy: currentUserAddress
		};

		shipmentRequests[shipmentIndex].trackingUpdates.push(trackingUpdate);

		// TODO: In real implementation, this would:
		// 1. Release escrow payments
		// 2. Update product ownership on blockchain
		// 3. Complete the supply chain cycle

		return { success: true };
	} catch (error) {
		console.error('Error confirming delivery:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to confirm delivery'
		};
	}
}

/**
 * Get overall workflow status (admin dashboard)
 */
export async function getWorkflowStatus(): Promise<WorkflowStatus> {
	// Calculate statistics from current data
	const pendingRequests = 0; // Would query from marketplace service
	const approvedRequests = 0;
	const rejectedRequests = 0;

	const pendingShipments = shipmentRequests.filter((s) => s.status === 'pending').length;
	const inTransitShipments = shipmentRequests.filter((s) =>
		['assigned', 'picked_up', 'in_transit'].includes(s.status)
	).length;
	const deliveredShipments = shipmentRequests.filter((s) =>
		['delivered', 'confirmed'].includes(s.status)
	).length;

	// Calculate average delivery time
	const completedShipments = shipmentRequests.filter((s) => s.actualDelivery);
	let avgDeliveryTime = 'N/A';

	if (completedShipments.length > 0) {
		const totalTime = completedShipments.reduce((acc, shipment) => {
			const created = new Date(shipment.requestedAt).getTime();
			const delivered = new Date(shipment.actualDelivery!).getTime();
			return acc + (delivered - created);
		}, 0);

		const avgMs = totalTime / completedShipments.length;
		const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
		avgDeliveryTime = `${avgDays} days`;
	}

	return {
		productRequests: {
			pending: pendingRequests,
			approved: approvedRequests,
			rejected: rejectedRequests
		},
		shipments: {
			pending: pendingShipments,
			in_transit: inTransitShipments,
			delivered: deliveredShipments
		},
		logistics: {
			active_providers: 3, // Mock data
			avg_delivery_time: avgDeliveryTime
		}
	};
}
