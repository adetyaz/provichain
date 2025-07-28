<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import { getProductById, updateProductMetadata, getManufacturerProducts } from '$lib';
	import { getStockHistory, updateStock, setReorderPoint } from '$lib';
	import { getPendingRequests, approveProductRequest, rejectProductRequest } from '$lib';
	import { createShipmentRequest } from '$lib';
	import type { Product } from '$lib/types';

	const productId = page.params.id;
	
	let product = $state<Product | null>(null);
	let loading = $state(true);
	let error = $state('');
	let editing = $state(false);
	let saving = $state(false);
	
	// Stock management
	let stockHistory = $state<any[]>([]);
	let stockAdjustment = $state(0);
	let stockReason = $state('');
	let newReorderPoint = $state(0);
	
	// Product requests management
	let productRequests = $state<any[]>([]);
	let loadingRequests = $state(false);
	let processingRequest = $state<string | null>(null);
	
	// Edit form data
	let editForm = $state({
		name: '',
		description: '',
		category: '',
		price: 0,
		specifications: {} as Record<string, string>
	});

	onMount(async () => {
		await loadProduct();
		await loadStockHistory();
		await loadProductRequests();
	});

	async function loadProduct() {
		try {
			loading = true;
			error = '';
			
			// For now, we'll need to get all products and find the one with matching ID
			// This could be optimized with a direct product lookup API
			const products = await getManufacturerProducts();
			product = products.find(p => p.id === productId) || null;
			
			if (!product) {
				error = 'Product not found';
				return;
			}

			// Initialize edit form
			editForm = {
				name: product.name,
				description: product.description,
				category: product.category,
				price: product.price || 0,
				specifications: product.specifications || {}
			};
			
			newReorderPoint = product.quantity * 0.2; // Default to 20% of total quantity
			
		} catch (err) {
			console.error('Error loading product:', err);
			error = err instanceof Error ? err.message : 'Failed to load product';
		} finally {
			loading = false;
		}
	}

	async function loadStockHistory() {
		try {
			stockHistory = await getStockHistory(productId);
		} catch (err) {
			console.error('Error loading stock history:', err);
		}
	}

	async function loadProductRequests() {
		try {
			loadingRequests = true;
			// Get pending requests for this specific product
			const allRequests = await getPendingRequests();
			productRequests = allRequests.filter(req => req.productId === productId);
		} catch (err) {
			console.error('Error loading product requests:', err);
		} finally {
			loadingRequests = false;
		}
	}

	async function saveProduct() {
		if (!product) return;
		
		try {
			saving = true;
			error = '';

			// Update product metadata on IPFS
			const updatedProduct = {
				...product,
				...editForm,
				updatedAt: new Date().toISOString()
			};

			await updateProductMetadata(product.id, updatedProduct);
			
			// Reload product data
			await loadProduct();
			editing = false;
			
		} catch (err) {
			console.error('Error updating product:', err);
			error = err instanceof Error ? err.message : 'Failed to update product';
		} finally {
			saving = false;
		}
	}

	async function adjustStock() {
		if (!product || stockAdjustment === 0 || !stockReason.trim()) return;
		
		try {
			await updateStock(product.id, stockAdjustment, stockReason);
			await loadStockHistory();
			
			// Reset form
			stockAdjustment = 0;
			stockReason = '';
			
		} catch (err) {
			console.error('Error adjusting stock:', err);
			error = err instanceof Error ? err.message : 'Failed to adjust stock';
		}
	}

	async function saveReorderPoint() {
		if (!product || newReorderPoint < 0) return;
		
		try {
			await setReorderPoint(product.id, newReorderPoint);
		} catch (err) {
			console.error('Error setting reorder point:', err);
			error = err instanceof Error ? err.message : 'Failed to set reorder point';
		}
	}

	function addSpecification() {
		editForm.specifications = { ...editForm.specifications, '': '' };
	}

	function removeSpecification(key: string) {
		const specs = { ...editForm.specifications };
		delete specs[key];
		editForm.specifications = specs;
	}

	function updateSpecificationKey(oldKey: string, newKey: string) {
		if (oldKey === newKey) return;
		
		const specs = { ...editForm.specifications };
		const value = specs[oldKey];
		delete specs[oldKey];
		specs[newKey] = value;
		editForm.specifications = specs;
	}

	function updateSpecificationValue(key: string, value: string) {
		editForm.specifications = { ...editForm.specifications, [key]: value };
	}

	async function handleApproveRequest(requestId: string) {
		if (!product) return;
		
		try {
			processingRequest = requestId;
			error = '';

			const result = await approveProductRequest(requestId, product.manufacturer);
			
			if (result.success) {
				// Find the approved request to create shipment
				const approvedRequest = productRequests.find(req => req.id === requestId);
				if (approvedRequest) {
					// Create shipment request
					await createShipmentRequest(
						product.id,
						product.name,
						product.manufacturer,
						approvedRequest.consumerId,
						'Manufacturer Facility', // Default pickup location
						'Consumer Address', // Default delivery location
						'normal'
					);
				}
				
				await loadProductRequests();
			} else {
				error = result.error || 'Failed to approve request';
			}
		} catch (err) {
			console.error('Error approving request:', err);
			error = err instanceof Error ? err.message : 'Failed to approve request';
		} finally {
			processingRequest = null;
		}
	}

	async function handleRejectRequest(requestId: string, reason: string) {
		try {
			processingRequest = requestId;
			error = '';

			const result = await rejectProductRequest(requestId, reason);
			
			if (result.success) {
				await loadProductRequests();
			} else {
				error = result.error || 'Failed to reject request';
			}
		} catch (err) {
			console.error('Error rejecting request:', err);
			error = err instanceof Error ? err.message : 'Failed to reject request';
		} finally {
			processingRequest = null;
		}
	}
</script>

<PageLayout title="Product Details">
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-200">Loading product...</span>
		</div>
	{:else if error}
		<Card title="Error">
			<div class="text-center py-8">
				<div class="text-red-600 mb-4">⚠️ {error}</div>
				<Button href="/manufacturer">← Back to Products</Button>
			</div>
		</Card>
	{:else if product}
		<div class="space-y-6">
			<!-- Product Header -->
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-white">{product.name}</h1>
					<p class="text-gray-200 mt-1">Product ID: {product.id}</p>
				</div>
				<div class="flex space-x-2">
					<Button href="/manufacturer">← Back</Button>
					{#if !editing}
						<Button onclick={() => editing = true} variant="outline">
							✏️ Edit Product
						</Button>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Product Information -->
				<Card title="Product Information">
					{#if editing}
						<!-- Edit Form -->
						<div class="space-y-4">
							<div>
								<label for="product-name" class="block text-sm font-medium text-white mb-1">Name</label>
								<input 
									id="product-name"
									type="text" 
									bind:value={editForm.name}
									class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
								/>
							</div>
							
							<div>
								<label for="product-description" class="block text-sm font-medium text-white mb-1">Description</label>
								<textarea 
									id="product-description"
									bind:value={editForm.description}
									rows="3"
									class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none resize-none"
								></textarea>
							</div>
							
							<div>
								<label for="product-category" class="block text-sm font-medium text-white mb-1">Category</label>
								<input 
									id="product-category"
									type="text" 
									bind:value={editForm.category}
									class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
								/>
							</div>
							
							<div>
								<label for="product-price" class="block text-sm font-medium text-white mb-1">Price ($)</label>
								<input 
									id="product-price"
									type="number" 
									bind:value={editForm.price}
									min="0"
									step="0.01"
									class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
								/>
							</div>
							
							<!-- Specifications -->
							<div>
								<div class="flex items-center justify-between mb-2">
									<div class="block text-sm font-medium text-white">Specifications</div>
									<Button onclick={addSpecification} variant="outline" size="sm">
										+ Add Spec
									</Button>
								</div>
								
								{#each Object.entries(editForm.specifications) as [key, value], i}
									<div class="flex space-x-2 mb-2">
										<input 
											type="text" 
											value={key}
											oninput={(e) => updateSpecificationKey(key, (e.target as HTMLInputElement).value)}
											placeholder="Property name"
											class="flex-1 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
										/>
										<input 
											type="text" 
											value={value}
											oninput={(e) => updateSpecificationValue(key, (e.target as HTMLInputElement).value)}
											placeholder="Value"
											class="flex-1 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
										/>
										<button 
											onclick={() => removeSpecification(key)}
											class="text-red-400 hover:text-red-300 px-2 transition-colors"
										>
											×
										</button>
									</div>
								{/each}
							</div>
							
							<!-- Save/Cancel Buttons -->
							<div class="flex space-x-2 pt-4">
								<Button 
									onclick={saveProduct} 
									class="flex-1"
								>
									{saving ? 'Saving...' : '💾 Save Changes'}
								</Button>
								<Button 
									onclick={() => editing = false} 
									variant="outline"
								>
									Cancel
								</Button>
							</div>
						</div>
					{:else}
						<!-- Display Mode -->
						<div class="space-y-3">
							<div>
								<span class="text-sm font-medium text-white">Description:</span>
								<p class="text-gray-200 mt-1">{product.description}</p>
							</div>
							
							<div>
								<span class="text-sm font-medium text-white">Category:</span>
								<span class="text-gray-200 ml-2">{product.category}</span>
							</div>
							
							{#if product.price}
								<div>
									<span class="text-sm font-medium text-white">Price:</span>
									<span class="text-gray-200 ml-2">${product.price}</span>
								</div>
							{/if}
							
							<div>
								<span class="text-sm font-medium text-white">Quantity Minted:</span>
								<span class="text-gray-200 ml-2">{product.quantity}</span>
							</div>
							
							<div>
								<span class="text-sm font-medium text-white">Minted At:</span>
								<span class="text-gray-200 ml-2">{new Date(product.mintedAt).toLocaleString()}</span>
							</div>
							
							{#if product.specifications && Object.keys(product.specifications).length > 0}
								<div>
									<span class="text-sm font-medium text-white">Specifications:</span>
									<div class="mt-2 space-y-1">
										{#each Object.entries(product.specifications) as [key, value]}
											<div class="flex justify-between text-sm">
												<span class="text-white">{key}:</span>
												<span class="text-gray-200">{value}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</Card>

				<!-- Stock Management -->
				<Card title="Stock Management">
					<!-- Current Stock Status -->
					<div class="bg-gray-700 rounded-lg p-4 mb-4">
						<div class="text-center">
							<div class="text-2xl font-bold text-green-400">{product.quantity}</div>
							<div class="text-sm text-white">Current Stock</div>
						</div>
					</div>
					
					<!-- Stock Adjustment -->
					<div class="space-y-3 mb-4">
						<h3 class="font-medium text-white">Adjust Stock</h3>
						<div class="flex space-x-2">
							<input 
								type="number" 
								bind:value={stockAdjustment}
								placeholder="±Amount"
								class="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
							/>
							<input 
								type="text" 
								bind:value={stockReason}
								placeholder="Reason"
								class="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
							/>
						</div>
						<Button 
							onclick={adjustStock}
							size="sm"
							class="w-full"
						>
							Apply Adjustment
						</Button>
					</div>
					
					<!-- Reorder Point -->
					<div class="space-y-3 mb-4">
						<h3 class="font-medium text-white">Reorder Point</h3>
						<div class="flex space-x-2">
							<input 
								type="number" 
								bind:value={newReorderPoint}
								min="0"
								class="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
							/>
							<Button onclick={saveReorderPoint} size="sm">
								Set
							</Button>
						</div>
						<p class="text-xs text-gray-300">Alert when stock falls below this level</p>
					</div>
					
					<!-- Stock History -->
					{#if stockHistory.length > 0}
						<div>
							<h3 class="font-medium text-white mb-2">Recent Changes</h3>
							<div class="space-y-2 max-h-40 overflow-y-auto">
								{#each stockHistory.slice(-5) as change}
									<div class="flex justify-between items-center text-sm border-b border-gray-600 pb-1">
										<div>
											<span class="font-medium {change.change > 0 ? 'text-green-400' : 'text-red-400'}">
												{change.change > 0 ? '+' : ''}{change.change}
											</span>
											<span class="text-gray-200 ml-2">{change.reason}</span>
										</div>
										<div class="text-gray-300 text-xs">
											{new Date(change.timestamp).toLocaleDateString()}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</Card>
			</div>

			<!-- Product Requests -->
			{#if productRequests.length > 0}
				<Card title="Product Requests" class="bg-gray-800 border-gray-700">
					{#if loadingRequests}
						<div class="flex items-center justify-center py-4">
							<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
							<span class="ml-2 text-gray-200">Loading requests...</span>
						</div>
					{:else}
						<div class="space-y-4">
							{#each productRequests as request}
								<div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
									<div class="flex items-start justify-between mb-3">
										<div>
											<h4 class="font-semibold text-white">{request.consumerName}</h4>
											<p class="text-sm text-gray-400">Requested {new Date(request.requestedAt).toLocaleDateString()}</p>
											<p class="text-sm text-gray-300">Quantity: {request.quantity}</p>
										</div>
										<span class="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
											{request.status}
										</span>
									</div>
									
									{#if request.message}
										<div class="mb-3">
											<p class="text-sm text-gray-300">
												<span class="text-gray-400">Message:</span> {request.message}
											</p>
										</div>
									{/if}
									
									<div class="flex space-x-2">
										<Button 
											onclick={() => handleApproveRequest(request.id)}
											size="sm"
											class="bg-green-600 hover:bg-green-700"
										>
											{processingRequest === request.id ? 'Processing...' : '✅ Approve'}
										</Button>
										<Button 
											onclick={() => handleRejectRequest(request.id, 'Insufficient stock')}
											size="sm"
											variant="outline"
											class="border-red-500 text-red-400 hover:bg-red-500/20"
										>
											❌ Reject
										</Button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card>
			{/if}

			<!-- Blockchain Information -->
			<Card title="Blockchain Information">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium text-white">Token ID:</span>
						<span class="text-gray-200 ml-2 font-mono">{product.id}</span>
					</div>
					<div>
						<span class="font-medium text-white">Manufacturer:</span>
						<span class="text-gray-200 ml-2 font-mono text-xs">{product.manufacturer}</span>
					</div>
					{#if product.ipfsHash}
						<div>
							<span class="font-medium text-white">IPFS Hash:</span>
							<span class="text-gray-200 ml-2 font-mono text-xs">{product.ipfsHash}</span>
						</div>
					{/if}
					<div>
						<span class="font-medium text-white">Status:</span>
						<span class="text-green-400 ml-2">Active</span>
					</div>
				</div>
			</Card>
		</div>
	{/if}
</PageLayout>
