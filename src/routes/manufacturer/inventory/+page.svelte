<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import { 
		getInventoryOverview, 
		getInventoryStats, 
		getInventoryAlerts,
		generateInventoryReport,
		type InventoryItem,
		type InventoryStats,
		type InventoryAlert
	} from '$lib';

	let loading = $state(true);
	let error = $state('');
	
	// Data
	let inventory = $state<InventoryItem[]>([]);
	let stats = $state<InventoryStats>({
		totalProducts: 0,
		totalStock: 0,
		lowStockItems: 0,
		outOfStockItems: 0,
		totalValue: 0
	});
	let alerts = $state<InventoryAlert[]>([]);
	
	// Filters
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let categoryFilter = $state('all');
	
	// Derived data
	let filteredInventory = $derived(inventory.filter(item => {
		const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							 item.productId.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
		const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
		
		return matchesSearch && matchesStatus && matchesCategory;
	}));
	
	let categories = $derived([...new Set(inventory.map(item => item.category))].filter(Boolean));

	onMount(async () => {
		await loadInventoryData();
	});

	async function loadInventoryData() {
		try {
			loading = true;
			error = '';
			
			// Load all inventory data in parallel
			const [inventoryData, statsData, alertsData] = await Promise.all([
				getInventoryOverview(),
				getInventoryStats(),
				getInventoryAlerts()
			]);
			
			inventory = inventoryData;
			stats = statsData;
			alerts = alertsData;
			
		} catch (err) {
			console.error('Error loading inventory data:', err);
			error = err instanceof Error ? err.message : 'Failed to load inventory data';
		} finally {
			loading = false;
		}
	}

	async function downloadReport() {
		try {
			const report = await generateInventoryReport();
			if (report) {
				// Convert report to JSON string and trigger download
				const dataStr = JSON.stringify(report, null, 2);
				const dataBlob = new Blob([dataStr], { type: 'application/json' });
				
				const url = URL.createObjectURL(dataBlob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			}
		} catch (err) {
			console.error('Error generating report:', err);
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'in-stock': return 'text-green-600 bg-green-100';
			case 'low-stock': return 'text-yellow-600 bg-yellow-100';
			case 'out-of-stock': return 'text-red-600 bg-red-100';
			case 'overstocked': return 'text-blue-600 bg-blue-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	function getAlertColor(severity: string): string {
		switch (severity) {
			case 'high': return 'border-red-500 bg-red-50';
			case 'medium': return 'border-yellow-500 bg-yellow-50';
			case 'low': return 'border-blue-500 bg-blue-50';
			default: return 'border-gray-500 bg-gray-50';
		}
	}
</script>

<PageLayout title="Inventory Management" subtitle="Monitor and manage your product inventory">
	{#if loading}
		<div class="flex items-center justify-center py-16">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<div class="text-gray-600 text-lg">Loading inventory data...</div>
			</div>
		</div>
	{:else if error}
		<Card title="Error">
			<div class="text-center py-8">
				<div class="text-red-600 mb-4">⚠️ {error}</div>
				<Button onclick={loadInventoryData}>🔄 Retry</Button>
			</div>
		</Card>
	{:else}
		<!-- Stats Overview -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<Card title="Total Products">
				<div class="text-center">
					<div class="text-3xl font-bold text-blue-600">{stats.totalProducts}</div>
					<div class="text-sm text-gray-600">Products</div>
				</div>
			</Card>
			
			<Card title="Total Stock">
				<div class="text-center">
					<div class="text-3xl font-bold text-green-600">{stats.totalStock}</div>
					<div class="text-sm text-gray-600">Units</div>
				</div>
			</Card>
			
			<Card title="Low Stock Items">
				<div class="text-center">
					<div class="text-3xl font-bold text-yellow-600">{stats.lowStockItems}</div>
					<div class="text-sm text-gray-600">Items</div>
				</div>
			</Card>
			
			<Card title="Total Value">
				<div class="text-center">
					<div class="text-3xl font-bold text-purple-600">${stats.totalValue.toLocaleString()}</div>
					<div class="text-sm text-gray-600">USD</div>
				</div>
			</Card>
		</div>

		<!-- Alerts Section -->
		{#if alerts.length > 0}
			<Card title="Inventory Alerts">
				<div class="space-y-3 mb-6">
					{#each alerts.slice(0, 5) as alert}
						<div class="border-l-4 p-3 rounded {getAlertColor(alert.severity)}">
							<div class="flex items-center justify-between">
								<div>
									<div class="font-medium text-gray-900">{alert.message}</div>
									<div class="text-sm text-gray-600">Product: {alert.productName}</div>
								</div>
								<div class="text-xs text-gray-500">
									{alert.severity.toUpperCase()}
								</div>
							</div>
						</div>
					{/each}
					{#if alerts.length > 5}
						<div class="text-center">
							<span class="text-sm text-gray-600">... and {alerts.length - 5} more alerts</span>
						</div>
					{/if}
				</div>
			</Card>
		{/if}

		<!-- Controls -->
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
			<div class="flex flex-col md:flex-row gap-4 flex-1">
				<!-- Search -->
				<div class="flex-1">
					<label for="search-inventory" class="sr-only">Search inventory</label>
					<input
						id="search-inventory"
						type="text"
						bind:value={searchQuery}
						placeholder="Search products..."
						class="w-full border border-gray-300 rounded-md px-3 py-2"
					/>
				</div>
				
				<!-- Status Filter -->
				<div>
					<label for="status-filter" class="sr-only">Filter by status</label>
					<select
						id="status-filter"
						bind:value={statusFilter}
						class="border border-gray-300 rounded-md px-3 py-2"
					>
						<option value="all">All Status</option>
						<option value="in-stock">In Stock</option>
						<option value="low-stock">Low Stock</option>
						<option value="out-of-stock">Out of Stock</option>
						<option value="overstocked">Overstocked</option>
					</select>
				</div>
				
				<!-- Category Filter -->
				<div>
					<label for="category-filter" class="sr-only">Filter by category</label>
					<select
						id="category-filter"
						bind:value={categoryFilter}
						class="border border-gray-300 rounded-md px-3 py-2"
					>
						<option value="all">All Categories</option>
						{#each categories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>
			</div>
			
			<div class="flex gap-2">
				<Button onclick={loadInventoryData} variant="outline">
					🔄 Refresh
				</Button>
				<Button onclick={downloadReport}>
					📊 Export Report
				</Button>
			</div>
		</div>

		<!-- Inventory Table -->
		<Card title="Inventory Items">
			{#if filteredInventory.length === 0}
				<div class="text-center py-8">
					<div class="text-gray-600 mb-4">
						{searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
							? 'No items match your filters' 
							: 'No inventory items found'}
					</div>
					{#if inventory.length === 0}
						<Button href="/manufacturer">
							📦 Start Creating Products
						</Button>
					{/if}
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Product
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Category
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Stock
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Last Updated
								</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each filteredInventory as item}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-4">
										<div>
											<div class="font-medium text-gray-900">{item.name}</div>
											<div class="text-sm text-gray-500">ID: {item.productId}</div>
										</div>
									</td>
									<td class="px-4 py-4 text-sm text-gray-600">
										{item.category || 'Uncategorized'}
									</td>
									<td class="px-4 py-4">
										<div class="text-sm">
											<div class="font-medium">{item.currentStock} / {item.totalMinted}</div>
											<div class="text-gray-500">
												Threshold: {item.lowStockThreshold}
											</div>
										</div>
									</td>
									<td class="px-4 py-4">
										<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(item.status)}">
											{item.status.replace('-', ' ')}
										</span>
									</td>
									<td class="px-4 py-4 text-sm text-gray-600">
										{new Date(item.lastUpdated).toLocaleDateString()}
									</td>
									<td class="px-4 py-4">
										<Button 
											href="/manufacturer/product/{item.productId}"
											size="sm"
											variant="outline"
										>
											View Details
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Card>
	{/if}
</PageLayout>
