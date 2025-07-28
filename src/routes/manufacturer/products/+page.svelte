<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import RouteGuard from '$lib/components/RouteGuard.svelte';
	import { getUserAddress, getManufacturerProducts } from '$lib';
	import type { Product } from '$lib/types';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// State management
	let loading = $state(true);
	let error = $state('');
	let allProducts = $state<Product[]>([]);
	let filteredProducts = $state<Product[]>([]);
	let userAddress = $state('');
	
	// Search and filter state
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let categoryFilter = $state('all');
	let sortBy = $state('newest');

	onMount(async () => {
		try {
			loading = true;
			error = '';
			
			userAddress = await getUserAddress();
			
			if (!userAddress) {
				goto('/connect');
				return;
			}

			// Get manufacturer's products
			allProducts = await getManufacturerProducts(userAddress);
			filteredProducts = allProducts;
		} catch (err) {
			error = 'Failed to load products: ' + (err instanceof Error ? err.message : String(err));
			console.error('Products page error:', err);
		} finally {
			loading = false;
		}
	});

	// Filter and search products
	$effect(() => {
		let filtered = [...allProducts];

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(product => 
				product.name.toLowerCase().includes(query) ||
				product.id.toLowerCase().includes(query) ||
				product.batch.toLowerCase().includes(query) ||
				product.description.toLowerCase().includes(query)
			);
		}

		// Apply status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(product => product.status === statusFilter);
		}

		// Apply category filter  
		if (categoryFilter !== 'all') {
			filtered = filtered.filter(product => product.category === categoryFilter);
		}

		// Apply sorting
		switch (sortBy) {
			case 'newest':
				filtered.sort((a, b) => new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime());
				break;
			case 'oldest':
				filtered.sort((a, b) => new Date(a.mintedAt).getTime() - new Date(b.mintedAt).getTime());
				break;
			case 'name':
				filtered.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'quantity':
				filtered.sort((a, b) => b.quantity - a.quantity);
				break;
		}

		filteredProducts = filtered;
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'Active': return 'text-green-400';
			case 'Sold': return 'text-blue-400';
			case 'Transferred': return 'text-yellow-400';
			default: return 'text-gray-400';
		}
	}

	function clearFilters() {
		searchQuery = '';
		statusFilter = 'all';
		categoryFilter = 'all';
		sortBy = 'newest';
	}

	// Get unique categories from products
	let uniqueCategories = $derived(
		[...new Set(allProducts.map(p => p.category).filter(c => c && c.trim()))]
	);
</script>

<RouteGuard requiredRole="manufacturer">
	<PageLayout title="My Products" subtitle="View and manage your minted products">
	<div class="products-page">
		{#if loading}
			<div class="flex items-center justify-center py-16">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
					<div class="text-green-400 text-lg">Loading your products...</div>
				</div>
			</div>
		{:else if error}
			<div class="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
				<div class="text-red-400 font-medium">{error}</div>
			</div>
		{:else}
			<!-- Header Stats -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<Card title="Total Products" class="bg-gray-800 border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white text-3xl font-bold">{allProducts.length}</p>
							<p class="text-gray-400 text-sm">Products Minted</p>
						</div>
						<div class="text-4xl">📦</div>
					</div>
				</Card>
				
				<Card title="Active Products" class="bg-gray-800 border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white text-3xl font-bold">{allProducts.filter((p: Product) => p.status === 'Active').length}</p>
							<p class="text-gray-400 text-sm">Currently Active</p>
						</div>
						<div class="text-4xl">✅</div>
					</div>
				</Card>
				
				<Card title="Total Sales" class="bg-gray-800 border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white text-3xl font-bold">{allProducts.filter((p: Product) => p.status === 'Sold').length}</p>
							<p class="text-gray-400 text-sm">Products Sold</p>
						</div>
						<div class="text-4xl">💰</div>
					</div>
				</Card>
			</div>

			<!-- Search and Filters -->
			<Card title="Search & Filter" class="bg-gray-800 border-gray-700 mb-6">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<!-- Search -->
					<div>
						<label for="search-products" class="block text-sm font-medium text-gray-300 mb-2">Search</label>
						<input
							id="search-products"
							bind:value={searchQuery}
							type="text"
							placeholder="Search products..."
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
						/>
					</div>
					
					<!-- Status Filter -->
					<div>
						<label for="filter-status" class="block text-sm font-medium text-gray-300 mb-2">Status</label>
						<select
							id="filter-status"
							bind:value={statusFilter}
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500"
						>
							<option value="all">All Status</option>
							<option value="Active">Active</option>
							<option value="Sold">Sold</option>
							<option value="Transferred">Transferred</option>
						</select>
					</div>
					
					<!-- Category Filter -->
					<div>
						<label for="filter-category" class="block text-sm font-medium text-gray-300 mb-2">Category</label>
						<select
							id="filter-category"
							bind:value={categoryFilter}
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500"
						>
							<option value="all">All Categories</option>
							{#each uniqueCategories as category}
								<option value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
							{/each}
						</select>
					</div>
					
					<!-- Sort By -->
					<div>
						<label for="sort-products" class="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
						<select
							id="sort-products"
							bind:value={sortBy}
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500"
						>
							<option value="newest">Newest First</option>
							<option value="oldest">Oldest First</option>
							<option value="name">Name A-Z</option>
							<option value="quantity">Quantity High-Low</option>
						</select>
					</div>
				</div>
				
				<!-- Filter Actions -->
				<div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
					<div class="text-sm text-gray-400">
						Showing {filteredProducts.length} of {allProducts.length} products
					</div>
					{#if searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'newest'}
						<Button onclick={clearFilters} variant="outline" size="sm">
							Clear Filters
						</Button>
					{/if}
				</div>
			</Card>

			<!-- Products List -->
			{#if filteredProducts.length === 0}
				<Card title={allProducts.length === 0 ? "No Products Found" : "No Matching Products"} class="bg-gray-800 border-gray-700 text-center">
					<div class="py-8">
						<div class="text-6xl mb-4">{allProducts.length === 0 ? '📦' : '🔍'}</div>
						{#if allProducts.length === 0}
							<h3 class="text-xl font-medium text-white mb-2">No products minted yet</h3>
							<p class="text-gray-400 mb-6">Start by minting your first product to see it here.</p>
							<Button onclick={() => goto('/manufacturer')}>
								Mint Your First Product
							</Button>
						{:else}
							<h3 class="text-xl font-medium text-white mb-2">No products match your filters</h3>
							<p class="text-gray-400 mb-6">Try adjusting your search criteria or clear the filters.</p>
							<Button onclick={clearFilters}>
								Clear Filters
							</Button>
						{/if}
					</div>
				</Card>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
					{#each filteredProducts as product}
						<Card title={product.name} class="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-colors">
							<div class="space-y-3">
								<!-- Product ID -->
								<div class="flex justify-between items-center">
									<span class="text-gray-400 text-sm">Product ID:</span>
									<span class="text-green-400 font-mono text-sm">{product.id}</span>
								</div>
								
								<!-- Batch Number -->
								<div class="flex justify-between items-center">
									<span class="text-gray-400 text-sm">Batch:</span>
									<span class="text-white text-sm">{product.batch}</span>
								</div>
								
								<!-- Quantity -->
								<div class="flex justify-between items-center">
									<span class="text-gray-400 text-sm">Quantity:</span>
									<span class="text-white text-sm">{product.quantity}</span>
								</div>
								
								<!-- Category -->
								{#if product.category}
									<div class="flex justify-between items-center">
										<span class="text-gray-400 text-sm">Category:</span>
										<span class="text-white text-sm capitalize">{product.category}</span>
									</div>
								{/if}
								
								<!-- Status -->
								<div class="flex justify-between items-center">
									<span class="text-gray-400 text-sm">Status:</span>
									<span class="{getStatusColor(product.status)} text-sm font-medium">{product.status}</span>
								</div>
								
								<!-- Minted Date -->
								<div class="flex justify-between items-center">
									<span class="text-gray-400 text-sm">Minted:</span>
									<span class="text-white text-sm">{formatDate(product.mintedAt)}</span>
								</div>
								
								<!-- Description -->
								{#if product.description}
									<div class="pt-2 border-t border-gray-600">
										<p class="text-gray-300 text-sm line-clamp-2">{product.description}</p>
									</div>
								{/if}
								
								<!-- Actions -->
								<div class="pt-3 border-t border-gray-600 space-y-2">
									<Button 
										onclick={() => goto(`/manufacturer/product/${product.id}`)}
										class="w-full bg-blue-600 hover:bg-blue-700"
									>
										📋 View Details
									</Button>
									
									{#if product.ipfsHash}
										<a 
											href="https://gateway.pinata.cloud/ipfs/{product.ipfsHash}"
											target="_blank"
											class="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-600/30 hover:border-blue-500/50 rounded-lg transition-colors"
										>
											<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd" />
											</svg>
											View on IPFS
										</a>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</PageLayout>
</RouteGuard>
