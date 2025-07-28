<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import RouteGuard from '$lib/components/RouteGuard.svelte';
	import { onMount } from 'svelte';
	import { getPendingRequests, getAllProductRequests, approveProductRequest, rejectProductRequest } from '$lib';
	import { getShipmentRequests, assignLogisticsProvider, getWorkflowStatus } from '$lib';

	let productRequests = $state<any[]>([]);
	let shipmentRequests = $state<any[]>([]);
	let workflowStatus = $state<any>({});
	let loading = $state(true);
	let error = $state('');
	let processing = $state<string | null>(null);
	
	// Filter states
	let requestFilter = $state('all'); // all, pending, approved, rejected
	let shipmentFilter = $state('all'); // all, pending, assigned, in_transit, delivered

	// Mock logistics providers (in real app, this would come from user registry)
	const logisticsProviders = [
		{ id: 'LP001', name: 'FastTrack Logistics', rating: 4.8, specialties: ['Electronics', 'Pharmaceuticals'] },
		{ id: 'LP002', name: 'Global Freight Solutions', rating: 4.6, specialties: ['Luxury Goods', 'Automotive'] },
		{ id: 'LP003', name: 'EcoShip Delivery', rating: 4.9, specialties: ['Food & Beverages', 'Textiles & Fashion'] }
	];

	let filteredRequests = $derived.by(() => {
		if (requestFilter === 'all') return productRequests;
		return productRequests.filter((req: any) => req.status === requestFilter);
	});

	let filteredShipments = $derived.by(() => {
		if (shipmentFilter === 'all') return shipmentRequests;
		return shipmentRequests.filter((ship: any) => ship.status === shipmentFilter);
	});

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			error = '';
			
			// Load all requests and shipments for admin view
			const [requests, shipments, status] = await Promise.all([
				getAllProductRequests(),
				getShipmentRequests(undefined, 'admin'),
				getWorkflowStatus()
			]);
			
			productRequests = requests;
			shipmentRequests = shipments;
			workflowStatus = status;
			
		} catch (err) {
			console.error('Error loading workflow data:', err);
			error = err instanceof Error ? err.message : 'Failed to load workflow data';
		} finally {
			loading = false;
		}
	}

	async function handleApproveRequest(requestId: string) {
		try {
			processing = requestId;
			error = '';

			const result = await approveProductRequest(requestId);
			
			if (result.success) {
				await loadData(); // Refresh data
			} else {
				error = result.error || 'Failed to approve request';
			}
		} catch (err) {
			console.error('Error approving request:', err);
			error = err instanceof Error ? err.message : 'Failed to approve request';
		} finally {
			processing = null;
		}
	}

	async function handleRejectRequest(requestId: string, reason: string) {
		try {
			processing = requestId;
			error = '';

			const result = await rejectProductRequest(requestId, reason);
			
			if (result.success) {
				await loadData(); // Refresh data
			} else {
				error = result.error || 'Failed to reject request';
			}
		} catch (err) {
			console.error('Error rejecting request:', err);
			error = err instanceof Error ? err.message : 'Failed to reject request';
		} finally {
			processing = null;
		}
	}

	async function handleAssignLogistics(shipmentId: string, logisticsId: string) {
		try {
			processing = shipmentId;
			error = '';

			// Calculate estimated delivery (5-7 days from now)
			const estimatedDate = new Date();
			estimatedDate.setDate(estimatedDate.getDate() + Math.floor(Math.random() * 3) + 5);
			
			const result = await assignLogisticsProvider(
				shipmentId, 
				logisticsId, 
				estimatedDate.toISOString()
			);
			
			if (result.success) {
				await loadData(); // Refresh data
			} else {
				error = result.error || 'Failed to assign logistics provider';
			}
		} catch (err) {
			console.error('Error assigning logistics:', err);
			error = err instanceof Error ? err.message : 'Failed to assign logistics provider';
		} finally {
			processing = null;
		}
	}
</script>

<RouteGuard requiredRole="admin">
	<PageLayout 
		title="Workflow Management" 
		subtitle="Orchestrate the supply chain from product requests to delivery"
	>
		{#if error}
			<div class="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
				<div class="text-red-400">{error}</div>
			</div>
		{/if}

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span class="ml-2 text-gray-200">Loading workflow data...</span>
			</div>
		{:else}
			<!-- Workflow Overview -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<Card title="Product Requests" class="bg-gray-800 border-gray-700">
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-gray-400">Pending:</span>
							<span class="text-yellow-400 font-semibold">{workflowStatus.productRequests?.pending || 0}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Approved:</span>
							<span class="text-green-400 font-semibold">{workflowStatus.productRequests?.approved || 0}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Rejected:</span>
							<span class="text-red-400 font-semibold">{workflowStatus.productRequests?.rejected || 0}</span>
						</div>
					</div>
				</Card>

				<Card title="Shipments" class="bg-gray-800 border-gray-700">
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-gray-400">Pending:</span>
							<span class="text-yellow-400 font-semibold">{workflowStatus.shipments?.pending || 0}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">In Transit:</span>
							<span class="text-blue-400 font-semibold">{workflowStatus.shipments?.in_transit || 0}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Delivered:</span>
							<span class="text-green-400 font-semibold">{workflowStatus.shipments?.delivered || 0}</span>
						</div>
					</div>
				</Card>

				<Card title="Logistics Network" class="bg-gray-800 border-gray-700">
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-gray-400">Active Providers:</span>
							<span class="text-green-400 font-semibold">{workflowStatus.logistics?.active_providers || 0}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-400">Avg Delivery:</span>
							<span class="text-blue-400 font-semibold">{workflowStatus.logistics?.avg_delivery_time || 'N/A'}</span>
						</div>
					</div>
				</Card>

				<Card title="Quick Actions" class="bg-gray-800 border-gray-700">
					<div class="space-y-2">
						<Button size="sm" class="w-full" onclick={() => loadData()}>
							🔄 Refresh Data
						</Button>
						<Button href="/admin/reports" size="sm" variant="outline" class="w-full">
							📊 View Reports
						</Button>
					</div>
				</Card>
			</div>

			<!-- Product Requests Management -->
			<Card title="Product Requests" class="mb-8 bg-gray-800 border-gray-700">
				<!-- Filter Tabs -->
				<div class="flex space-x-1 mb-4 bg-gray-700 rounded-lg p-1">
					<button 
						onclick={() => requestFilter = 'all'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {requestFilter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						All ({productRequests.length})
					</button>
					<button 
						onclick={() => requestFilter = 'pending'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {requestFilter === 'pending' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						Pending ({productRequests.filter(r => r.status === 'pending').length})
					</button>
					<button 
						onclick={() => requestFilter = 'approved'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {requestFilter === 'approved' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						Approved ({productRequests.filter(r => r.status === 'approved').length})
					</button>
					<button 
						onclick={() => requestFilter = 'rejected'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {requestFilter === 'rejected' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						Rejected ({productRequests.filter(r => r.status === 'rejected').length})
					</button>
				</div>

				{#if filteredRequests.length === 0}
					<div class="text-center py-8 text-gray-400">
						No {requestFilter === 'all' ? '' : requestFilter} product requests found.
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredRequests as request}
							<div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1">
										<div class="flex items-center space-x-3 mb-2">
											<h4 class="font-semibold text-white">Product Request #{request.id.slice(-8)}</h4>
											<span class="px-2 py-1 text-xs rounded-full {
												request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
												request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
												'bg-red-500/20 text-red-400'
											}">
												{request.status}
											</span>
										</div>
										<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
											<div>
												<p class="text-gray-400">Product:</p>
												<p class="text-white">{request.productId.slice(-8)}</p>
											</div>
											<div>
												<p class="text-gray-400">Consumer:</p>
												<p class="text-white">{request.consumerName}</p>
											</div>
											<div>
												<p class="text-gray-400">Manufacturer:</p>
												<p class="text-white">{request.manufacturerName}</p>
											</div>
											<div>
												<p class="text-gray-400">Requested:</p>
												<p class="text-white">{new Date(request.requestedAt).toLocaleDateString()}</p>
											</div>
										</div>
										{#if request.message}
											<p class="text-gray-300 text-sm mt-2">Message: {request.message}</p>
										{/if}
									</div>
									
									{#if request.status === 'pending'}
										<div class="flex space-x-2">
											<Button 
												onclick={() => handleApproveRequest(request.id)}
												size="sm"
												class="bg-green-600 hover:bg-green-700"
											>
												{processing === request.id ? '⏳' : '✅'} Approve
											</Button>
											<Button 
												onclick={() => handleRejectRequest(request.id, 'Admin review required')}
												size="sm"
												variant="outline"
												class="border-red-500 text-red-400 hover:bg-red-500/20"
											>
												❌ Reject
											</Button>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>

			<!-- Shipment Management -->
			<Card title="Shipment Management" class="bg-gray-800 border-gray-700">
				<!-- Filter Tabs -->
				<div class="flex space-x-1 mb-4 bg-gray-700 rounded-lg p-1">
					<button 
						onclick={() => shipmentFilter = 'all'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {shipmentFilter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						All ({shipmentRequests.length})
					</button>
					<button 
						onclick={() => shipmentFilter = 'pending'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {shipmentFilter === 'pending' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						Pending ({shipmentRequests.filter(s => s.status === 'pending').length})
					</button>
					<button 
						onclick={() => shipmentFilter = 'assigned'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {shipmentFilter === 'assigned' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						Assigned ({shipmentRequests.filter(s => s.status === 'assigned').length})
					</button>
					<button 
						onclick={() => shipmentFilter = 'in_transit'}
						class="flex-1 px-3 py-2 text-sm rounded-md transition-colors {shipmentFilter === 'in_transit' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}"
					>
						In Transit ({shipmentRequests.filter(s => s.status === 'in_transit').length})
					</button>
				</div>

				{#if filteredShipments.length === 0}
					<div class="text-center py-8 text-gray-400">
						No {shipmentFilter === 'all' ? '' : shipmentFilter} shipments found.
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredShipments as shipment}
							<div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1">
										<div class="flex items-center space-x-3 mb-2">
											<h4 class="font-semibold text-white">Shipment #{shipment.id.slice(-8)}</h4>
											<span class="px-2 py-1 text-xs rounded-full {
												shipment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
												shipment.status === 'assigned' ? 'bg-blue-500/20 text-blue-400' :
												shipment.status === 'in_transit' ? 'bg-purple-500/20 text-purple-400' :
												'bg-green-500/20 text-green-400'
											}">
												{shipment.status.replace('_', ' ').toUpperCase()}
											</span>
											<span class="px-2 py-1 text-xs rounded-full {
												shipment.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
												shipment.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
												'bg-gray-500/20 text-gray-400'
											}">
												{shipment.priority.toUpperCase()}
											</span>
										</div>
										<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
											<div>
												<p class="text-gray-400">Product:</p>
												<p class="text-white">{shipment.productName}</p>
											</div>
											<div>
												<p class="text-gray-400">Route:</p>
												<p class="text-white">{shipment.pickupLocation} → {shipment.deliveryLocation}</p>
											</div>
											<div>
												<p class="text-gray-400">Consumer:</p>
												<p class="text-white">{shipment.consumerName}</p>
											</div>
											<div>
												<p class="text-gray-400">Requested:</p>
												<p class="text-white">{new Date(shipment.requestedAt).toLocaleDateString()}</p>
											</div>
										</div>
										{#if shipment.assignedLogisticsName}
											<p class="text-green-400 text-sm mt-2">Assigned to: {shipment.assignedLogisticsName}</p>
										{/if}
									</div>
									
									{#if shipment.status === 'pending'}
										<div class="space-y-2">
											<p class="text-gray-400 text-sm">Assign Logistics Provider:</p>
											<div class="flex space-x-2">
												{#each logisticsProviders as provider}
													<Button 
														onclick={() => handleAssignLogistics(shipment.id, provider.id)}
														size="sm"
														variant="outline"
														class="text-xs"
													>
														{processing === shipment.id ? '⏳' : '🚚'} {provider.name}
													</Button>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		{/if}
	</PageLayout>
</RouteGuard>
