<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { onMount } from 'svelte';
	import { getAvailableProducts } from '$lib';
	import { requestProduct } from '$lib/services/marketplace-service';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { Product } from '$lib/types';

	let products = $state<Product[]>([]);
	let loading = $state(true);
	let error = $state('');
	let requesting = $state<string | null>(null);
	let searchTerm = $state('');
	let selectedCategory = $state('all');
	let sortBy = $state('name');
	
	// Shipping modal state
	let showShippingModal = $state(false);
	let selectedProductId = $state('');
	let requestQuantity = $state(1);
	let shippingForm = $state({
		fullName: '',
		addressLine1: '',
		addressLine2: '',
		city: '',
		state: '',
		postalCode: '',
		country: '',
		phoneNumber: ''
	});

	// Filters and categories
	const categories = ['all', 'Food & Beverages', 'Electronics', 'Textiles & Fashion', 'Pharmaceuticals', 'Automotive', 'Luxury Goods'];
	const sortOptions = [
		{ value: 'name', label: 'Name' },
		{ value: 'price-low', label: 'Price: Low to High' },
		{ value: 'price-high', label: 'Price: High to Low' },
		{ value: 'newest', label: 'Newest First' }
	];

	let filteredProducts = $derived.by(() => {
		let filtered = products.filter((product: any) => {
			const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
								product.description?.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
			return matchesSearch && matchesCategory && product.quantity > 0; // Only show available products
		});

		// Sort products
		switch (sortBy) {
			case 'price-low':
				return filtered.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
			case 'price-high':
				return filtered.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
			case 'newest':
				return filtered.sort((a: any, b: any) => new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime());
			default:
				return filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
		}
	});

	onMount(async () => {
		try {
			loading = true;
			products = await getAvailableProducts();
		} catch (err) {
			error = 'Failed to load products. Please try again.';
			console.error('Error loading products:', err);
		} finally {
			loading = false;
		}
	});

	async function handleProductRequest(productId: string, quantity: number) {
		if (!$user) {
			goto('/connect');
			return;
		}

		if ($user.role !== 'consumer') {
			alert('Only consumers can request products');
			return;
		}

		// Show shipping modal instead of directly requesting
		selectedProductId = productId;
		requestQuantity = quantity;
		showShippingModal = true;
	}

	async function submitProductRequest() {
		if (!$user) {
			goto('/connect');
			return;
		}

		try {
			requesting = selectedProductId;
			
			// Validate shipping form
			const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
			for (const field of requiredFields) {
				if (!shippingForm[field as keyof typeof shippingForm]?.trim()) {
					error = `${field} is required for shipping`;
					return;
				}
			}

			await requestProduct(
				selectedProductId, 
				$user.address, 
				requestQuantity, 
				`Requesting ${requestQuantity} units`,
				shippingForm
			);
			
			// Refresh products to show updated quantities
			products = await getAvailableProducts();
			
			// Close modal and reset form
			showShippingModal = false;
			resetShippingForm();
			error = '';
		} catch (err) {
			error = 'Failed to request product. Please try again.';
			console.error('Error requesting product:', err);
		} finally {
			requesting = null;
		}
	}

	function resetShippingForm() {
		shippingForm = {
			fullName: '',
			addressLine1: '',
			addressLine2: '',
			city: '',
			state: '',
			postalCode: '',
			country: '',
			phoneNumber: ''
		};
		selectedProductId = '';
		requestQuantity = 1;
	}
</script>

<svelte:head>
	<title>Marketplace - ProViChain</title>
	<meta name="description" content="Discover and request authentic products with verified supply chain transparency" />
</svelte:head>

<PageLayout title="Marketplace" subtitle="Discover and request authentic products with verified supply chain transparency">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-white mb-4">Product Marketplace</h1>
			<p class="text-gray-300 text-lg">
				Discover authentic products with complete supply chain transparency. 
				Each product is backed by blockchain technology ensuring authenticity and traceability.
			</p>
		</div>

		{#if error}
			<div class="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
				{error}
				<button onclick={() => error = ''} class="float-right text-red-400 hover:text-red-300">
					&times;
				</button>
			</div>
		{/if}

		<!-- Search and Filters -->
		<div class="bg-gray-800 rounded-lg p-6 mb-8">
			<div class="mb-4">
				<input
					type="text"
					placeholder="Search products..."
					bind:value={searchTerm}
					class="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
				/>
			</div>
			
			<!-- Filters -->
			<div class="flex flex-wrap gap-4">
				<div class="flex-1 min-w-48">
					<label for="category-select" class="block text-sm font-medium text-white mb-1">Category</label>
					<select 
						id="category-select"
						bind:value={selectedCategory}
						class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-green-500 focus:outline-none"
					>
						{#each categories as category}
							<option value={category}>
								{category === 'all' ? 'All Categories' : category}
							</option>
						{/each}
					</select>
				</div>
				
				<div class="flex-1 min-w-48">
					<label for="sort-select" class="block text-sm font-medium text-white mb-1">Sort By</label>
					<select 
						id="sort-select"
						bind:value={sortBy}
						class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-green-500 focus:outline-none"
					>
						{#each sortOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
			</div>
		{:else if filteredProducts.length === 0}
			<div class="text-center py-12">
				<div class="text-gray-400 text-lg mb-4">
					{products.length === 0 
						? 'No products available at the moment' 
						: 'No products match your search criteria'
					}
				</div>
				{#if searchTerm || selectedCategory !== 'all'}
					<Button 
						onclick={() => {
							searchTerm = '';
							selectedCategory = 'all';
						}}
						variant="secondary"
					>
						Clear Filters
					</Button>
				{/if}
			</div>
		{:else}
			<!-- Products Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each filteredProducts as product}
					<div class="h-full">
						<Card 
							title={product.name}
							description="Available product in marketplace"
							class="h-full flex flex-col"
						>
						<div class="p-6 flex-1 flex flex-col">
							<!-- Product Image/Icon -->
							<div class="w-full h-48 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg mb-4 flex items-center justify-center flex-shrink-0">
								<div class="text-4xl">
									{#if product.category === 'Food & Beverages'}🍎
									{:else if product.category === 'Electronics'}📱
									{:else if product.category === 'Textiles & Fashion'}👕
									{:else if product.category === 'Pharmaceuticals'}💊
									{:else if product.category === 'Automotive'}🚗
									{:else if product.category === 'Luxury Goods'}💎
									{:else}📦{/if}
								</div>
							</div>

							<!-- Product Info -->
							<div class="space-y-3 flex-1">
								<h3 class="text-xl font-semibold text-white truncate" title={product.name}>{product.name}</h3>
								<p class="text-gray-300 text-sm line-clamp-2">{product.description}</p>
								
								<div class="flex justify-between items-center text-sm">
									<span class="text-gray-400">Category</span>
									<span class="text-green-400 text-right truncate max-w-[120px]" title={product.category}>
										{product.category}
									</span>
								</div>
								
								{#if product.price}
									<div class="flex justify-between items-center text-sm">
										<span class="text-gray-400">Price</span>
										<span class="text-green-400">${product.price}</span>
									</div>
								{/if}
								
								<div class="flex justify-between items-center text-sm">
									<span class="text-gray-400">Available</span>
									<span class="text-white">{product.quantity} units</span>
								</div>
								
								<div class="flex justify-between items-center text-sm">
									<span class="text-gray-400">Manufacturer</span>
									<span class="text-white text-right truncate max-w-[120px]" title={product.manufacturer || 'Unknown'}>
										{product.manufacturer || 'Unknown'}
									</span>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="mt-4 space-y-2 flex-shrink-0">
								<Button 
									onclick={() => goto(`/product/${product.id}`)}
									variant="secondary"
									class="w-full"
								>
									View Details
								</Button>
								
								{#if $user?.role === 'consumer'}
									<Button 
										onclick={() => handleProductRequest(product.id, 1)}
										size="sm"
										class="w-full"
									>
										{requesting === product.id ? 'Requesting...' : '🛒 Request Product'}
									</Button>
								{:else if !$user}
									<Button 
										onclick={() => goto('/connect')}
										variant="primary"
										class="w-full"
									>
										Connect Wallet to Request
									</Button>
								{:else}
									<div class="text-center text-gray-400 text-sm py-2">
										Only consumers can request products
									</div>
								{/if}
							</div>
						</div>
					</Card>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Shipping Address Modal -->
	{#if showShippingModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
				<h3 class="text-xl font-semibold text-white mb-4">Shipping Address</h3>
				<p class="text-gray-400 mb-6">Please provide your shipping address to complete the product request:</p>
				
				<form class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="fullName" class="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
							<input
								id="fullName"
								bind:value={shippingForm.fullName}
								type="text"
								required
								placeholder="John Doe"
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
									focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
							/>
						</div>
						<div>
							<label for="phoneNumber" class="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
							<input
								id="phoneNumber"
								bind:value={shippingForm.phoneNumber}
								type="tel"
								placeholder="+1 (555) 123-4567"
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
									focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
							/>
						</div>
					</div>

					<div>
						<label for="addressLine1" class="block text-sm font-medium text-gray-300 mb-2">Address Line 1 *</label>
						<input
							id="addressLine1"
							bind:value={shippingForm.addressLine1}
							type="text"
							required
							placeholder="123 Main Street"
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
								focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
						/>
					</div>

					<div>
						<label for="addressLine2" class="block text-sm font-medium text-gray-300 mb-2">Address Line 2</label>
						<input
							id="addressLine2"
							bind:value={shippingForm.addressLine2}
							type="text"
							placeholder="Apartment, suite, etc."
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
								focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
						/>
					</div>

					<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
						<div>
							<label for="city" class="block text-sm font-medium text-gray-300 mb-2">City *</label>
							<input
								id="city"
								bind:value={shippingForm.city}
								type="text"
								required
								placeholder="New York"
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
									focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
							/>
						</div>
						<div>
							<label for="state" class="block text-sm font-medium text-gray-300 mb-2">State/Province *</label>
							<input
								id="state"
								bind:value={shippingForm.state}
								type="text"
								required
								placeholder="NY"
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
									focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
							/>
						</div>
						<div>
							<label for="postalCode" class="block text-sm font-medium text-gray-300 mb-2">Postal Code *</label>
							<input
								id="postalCode"
								bind:value={shippingForm.postalCode}
								type="text"
								required
								placeholder="10001"
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
									focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
							/>
						</div>
					</div>

					<div>
						<label for="country" class="block text-sm font-medium text-gray-300 mb-2">Country *</label>
						<select
							id="country"
							bind:value={shippingForm.country}
							required
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
								focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
						>
							<option value="">Select Country</option>
							<option value="US">United States</option>
							<option value="CA">Canada</option>
							<option value="GB">United Kingdom</option>
							<option value="DE">Germany</option>
							<option value="FR">France</option>
							<option value="JP">Japan</option>
							<option value="AU">Australia</option>
							<option value="OTHER">Other</option>
						</select>
					</div>

					{#if error}
						<div class="bg-red-900/20 border border-red-500 rounded-lg p-3">
							<div class="text-red-400 text-sm">{error}</div>
						</div>
					{/if}

					<div class="flex space-x-3 mt-6 pt-4 border-t border-gray-700">
						<Button 
							onclick={submitProductRequest}
							class="flex-1 bg-blue-600 hover:bg-blue-700"
						>
							{requesting ? 'Submitting Request...' : '🛒 Submit Request'}
						</Button>
						<Button 
							onclick={() => { showShippingModal = false; resetShippingForm(); error = ''; }}
							variant="outline"
							class="flex-1"
						>
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</PageLayout>
