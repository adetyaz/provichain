<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { checkUserRole, mintProduct, getUserAddress, updateQualityData, setQualityThresholds, createShipment, updateLocation } from '$lib/web3';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// State management - Svelte 5 syntax
	let isManufacturer = $state(false);
	let userAddress = $state('');
	let loading = $state(true);
	let error = $state('');
	let success = $state('');

	// Product form data - Svelte 5 syntax
	let productForm = $state({
		id: '',
		name: '',
		batch: '',
		description: '',
		category: '',
		// ASC Configuration
		enableQualityMonitoring: true,
		temperatureThreshold: '25',
		humidityThreshold: '70',
		enablePaymentAutomation: false,
		paymentConditions: 'delivery_confirmation',
		enableInsurance: false,
		insuranceValue: ''
	});

	// Quality monitoring form
	let qualityForm = $state({
		productId: '',
		temperature: '',
		humidity: ''
	});

	// Location tracking form
	let locationForm = $state({
		productId: '',
		location: '',
		latitude: '',
		longitude: ''
	});

	// Shipment creation form
	let shipmentForm = $state({
		productId: '',
		origin: '',
		destination: '',
		carrier: ''
	});

	// Check if user has manufacturer role
	onMount(async () => {
		try {
			loading = true;
			userAddress = await getUserAddress();
			isManufacturer = await checkUserRole('MANUFACTURER');
			
			if (!userAddress) {
				goto('/connect');
				return;
			}
			
			if (!isManufacturer) {
				error = 'You need MANUFACTURER role to access this page';
			}
		} catch (err) {
			error = 'Failed to load manufacturer dashboard';
			console.error('Manufacturer page error:', err);
		} finally {
			loading = false;
		}
	});

	// Generate unique product ID
	function generateProductId() {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 8);
		return `PROD-${timestamp}-${random.toUpperCase()}`;
	}

	// Handle product minting
	async function handleMintProduct(event: Event) {
		event.preventDefault();
		
		if (!productForm.name || !productForm.batch) {
			error = 'Please fill in required fields';
			return;
		}

		try {
			loading = true;
			error = '';
			success = '';

			// Generate product ID if not provided
			if (!productForm.id) {
				productForm.id = generateProductId();
			}

			const result = await mintProduct({
				id: productForm.id,
				name: productForm.name,
				batch: productForm.batch,
				description: productForm.description,
				category: productForm.category,
				// ASC Configuration
				ascConfig: {
					enableQualityMonitoring: productForm.enableQualityMonitoring,
					temperatureThreshold: productForm.temperatureThreshold,
					humidityThreshold: productForm.humidityThreshold,
					enablePaymentAutomation: productForm.enablePaymentAutomation,
					paymentConditions: productForm.paymentConditions,
					enableInsurance: productForm.enableInsurance,
					insuranceValue: productForm.insuranceValue
				}
			});

			if (result.success) {
				success = `Product ${productForm.id} minted successfully! IPFS Hash: ${result.ipfsHash}`;
				// Reset form
				productForm = {
					id: '',
					name: '',
					batch: '',
					description: '',
					category: '',
					enableQualityMonitoring: true,
					temperatureThreshold: '25',
					humidityThreshold: '70',
					enablePaymentAutomation: false,
					paymentConditions: 'delivery_confirmation',
					enableInsurance: false,
					insuranceValue: ''
				};
			} else {
				error = result.error || 'Failed to mint product';
			}
		} catch (err) {
			error = 'Error minting product: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			loading = false;
		}
	}

	// Handle quality data update
	async function updateQuality() {
		try {
			loading = true;
			error = '';
			success = '';

			const result = await updateQualityData(
				qualityForm.productId,
				parseFloat(qualityForm.temperature),
				parseFloat(qualityForm.humidity)
			);

			if (result.success) {
				success = `Quality data updated for ${qualityForm.productId}`;
				qualityForm = { productId: '', temperature: '', humidity: '' };
			} else {
				error = result.message || 'Failed to update quality data';
			}
		} catch (err) {
			error = 'Error updating quality: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			loading = false;
		}
	}

	// Handle location update
	async function updateProductLocation() {
		try {
			loading = true;
			error = '';
			success = '';

			const result = await updateLocation(
				locationForm.productId,
				locationForm.location,
				parseFloat(locationForm.latitude),
				parseFloat(locationForm.longitude)
			);

			if (result.success) {
				success = `Location updated for ${locationForm.productId}`;
				locationForm = { productId: '', location: '', latitude: '', longitude: '' };
			} else {
				error = result.message || 'Failed to update location';
			}
		} catch (err) {
			error = 'Error updating location: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			loading = false;
		}
	}

	// Handle shipment creation
	async function createProductShipment() {
		try {
			loading = true;
			error = '';
			success = '';

			const result = await createShipment(
				shipmentForm.productId,
				shipmentForm.origin,
				shipmentForm.destination,
				shipmentForm.carrier
			);

			if (result.success) {
				success = `Shipment created for ${shipmentForm.productId}`;
				shipmentForm = { productId: '', origin: '', destination: '', carrier: '' };
			} else {
				error = result.message || 'Failed to create shipment';
			}
		} catch (err) {
			error = 'Error creating shipment: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			loading = false;
		}
	}

	// Sample stats for display - Svelte 5 syntax
	let stats = $derived([
		{ label: 'Your Address', value: userAddress ? userAddress.slice(0, 8) + '...' : 'Loading...', icon: '👤' },
		{ label: 'Role Status', value: isManufacturer ? 'MANUFACTURER' : 'NO ROLE', icon: '🏭' },
		{ label: 'Products Minted', value: '0', icon: '📦' },
		{ label: 'Blockchain', value: 'Massa', icon: '⛓️' }
	]);
</script>

<PageLayout title="Manufacturer Dashboard" subtitle="Mint and manage your products on the blockchain">
	<div class="manufacturer-dashboard">
		{#if loading}
			<div class="text-center py-8">
				<div class="text-blue-400">Loading manufacturer dashboard...</div>
			</div>
		{:else if error && !isManufacturer}
			<div class="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
				<div class="text-red-400 font-medium">{error}</div>
				<div class="text-red-300 text-sm mt-2">
					You need to request MANUFACTURER role first. 
					<a href="/connect" class="underline">Go to role assignment</a>
				</div>
			</div>
		{:else}
			<!-- Stats Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{#each stats as stat}
					<Card title={stat.label} class="bg-gray-800 border-gray-700">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-white text-2xl font-semibold mt-1">{stat.value}</p>
							</div>
							<div class="text-3xl">{stat.icon}</div>
						</div>
					</Card>
				{/each}
			</div>

			<!-- Product Minting Form -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Mint New Product -->
				<Card title="🏭 Mint New Product" class="bg-gray-800 border-gray-700">
					{#if success}
						<div class="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
							<div class="text-green-400">{success}</div>
						</div>
					{/if}

					{#if error}
						<div class="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
							<div class="text-red-400">{error}</div>
						</div>
					{/if}

					<form onsubmit={handleMintProduct} class="space-y-4">
						<div>
							<label for="product-id" class="block text-gray-300 text-sm font-medium mb-2">
								Product ID (Optional - will auto-generate)
							</label>
							<input
								id="product-id"
								type="text"
								bind:value={productForm.id}
								placeholder="Leave empty to auto-generate"
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="product-name" class="block text-gray-300 text-sm font-medium mb-2">
								Product Name *
							</label>
							<input
								id="product-name"
								type="text"
								bind:value={productForm.name}
								placeholder="Enter product name"
								required
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="product-batch" class="block text-gray-300 text-sm font-medium mb-2">
								Batch Number *
							</label>
							<input
								id="product-batch"
								type="text"
								bind:value={productForm.batch}
								placeholder="Enter batch number"
								required
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="product-description" class="block text-gray-300 text-sm font-medium mb-2">
								Description
							</label>
							<textarea
								id="product-description"
								bind:value={productForm.description}
								placeholder="Product description"
								rows="3"
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							></textarea>
						</div>

						<div>
							<label for="product-category" class="block text-gray-300 text-sm font-medium mb-2">
								Category
							</label>
							<select
								id="product-category"
								bind:value={productForm.category}
								class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select category</option>
								<option value="food">Food & Beverages</option>
								<option value="electronics">Electronics</option>
								<option value="textiles">Textiles</option>
								<option value="pharmaceuticals">Pharmaceuticals</option>
								<option value="other">Other</option>
							</select>
						</div>

						<!-- ASC Configuration -->
						<div class="border-t border-gray-600 pt-6 mt-6">
							<h3 class="text-lg font-medium text-white mb-4 flex items-center gap-2">
								🤖 Autonomous Smart Contract (ASC) Configuration
							</h3>
							
							<!-- Quality Monitoring -->
							<div class="mb-4">
								<label class="flex items-center gap-3">
									<input
										type="checkbox"
										bind:checked={productForm.enableQualityMonitoring}
										class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
									/>
									<span class="text-gray-300">Enable Autonomous Quality Monitoring</span>
								</label>
								{#if productForm.enableQualityMonitoring}
									<div class="grid grid-cols-2 gap-4 mt-3 ml-7">
										<div>
											<label for="temp-threshold" class="block text-gray-400 text-sm mb-1">
												Temperature Threshold (°C)
											</label>
											<input
												id="temp-threshold"
												type="number"
												bind:value={productForm.temperatureThreshold}
												placeholder="25"
												class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label for="humidity-threshold" class="block text-gray-400 text-sm mb-1">
												Humidity Threshold (%)
											</label>
											<input
												id="humidity-threshold"
												type="number"
												bind:value={productForm.humidityThreshold}
												placeholder="70"
												class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</div>
								{/if}
							</div>

							<!-- Payment Automation -->
							<div class="mb-4">
								<label class="flex items-center gap-3">
									<input
										type="checkbox"
										bind:checked={productForm.enablePaymentAutomation}
										class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
									/>
									<span class="text-gray-300">Enable Automated Conditional Payments</span>
								</label>
								{#if productForm.enablePaymentAutomation}
									<div class="mt-3 ml-7">
										<label for="payment-conditions" class="block text-gray-400 text-sm mb-1">
											Payment Trigger Condition
										</label>
										<select
											id="payment-conditions"
											bind:value={productForm.paymentConditions}
											class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="delivery_confirmation">Delivery Confirmation</option>
											<option value="quality_verification">Quality Verification</option>
											<option value="milestone_completion">Milestone Completion</option>
											<option value="time_based">Time-based Release</option>
										</select>
									</div>
								{/if}
							</div>

							<!-- Insurance -->
							<div class="mb-4">
								<label class="flex items-center gap-3">
									<input
										type="checkbox"
										bind:checked={productForm.enableInsurance}
										class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
									/>
									<span class="text-gray-300">Enable Smart Insurance</span>
								</label>
								{#if productForm.enableInsurance}
									<div class="mt-3 ml-7">
										<label for="insurance-value" class="block text-gray-400 text-sm mb-1">
											Insurance Coverage Value (MAS)
										</label>
										<input
											id="insurance-value"
											type="number"
											step="0.01"
											bind:value={productForm.insuranceValue}
											placeholder="100.00"
											class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								{/if}
							</div>
						</div>

						<Button 
							disabled={loading || !productForm.name || !productForm.batch}
							class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
						>
							{loading ? 'Minting...' : 'Mint Product NFT'}
						</Button>
					</form>
				</Card>

				<!-- Product Management -->
				<Card title="📊 Product Management" class="bg-gray-800 border-gray-700">
					<div class="space-y-6">
						<!-- Quality Monitoring Update -->
						<div>
							<h3 class="text-white font-medium mb-3">🌡️ Update Quality Data</h3>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Product ID</label>
									<input
										bind:value={qualityForm.productId}
										placeholder="PVC-2025-001"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Temperature (°C)</label>
									<input
										bind:value={qualityForm.temperature}
										type="number"
										placeholder="25"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Humidity (%)</label>
									<input
										bind:value={qualityForm.humidity}
										type="number"
										placeholder="60"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div class="flex items-end">
									<Button 
										onclick={updateQuality}
										disabled={!qualityForm.productId || !qualityForm.temperature || !qualityForm.humidity}
										class="w-full bg-orange-600 hover:bg-orange-700"
									>
										Update Quality
									</Button>
								</div>
							</div>
						</div>

						<!-- Location Tracking Update -->
						<div class="border-t border-gray-600 pt-6">
							<h3 class="text-white font-medium mb-3">📍 Update Location</h3>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Product ID</label>
									<input
										bind:value={locationForm.productId}
										placeholder="PVC-2025-001"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Location Name</label>
									<input
										bind:value={locationForm.location}
										placeholder="New York Warehouse"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Latitude</label>
									<input
										bind:value={locationForm.latitude}
										type="number"
										step="0.000001"
										placeholder="40.7128"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Longitude</label>
									<input
										bind:value={locationForm.longitude}
										type="number"
										step="0.000001"
										placeholder="-74.0060"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
							<Button 
								onclick={updateProductLocation}
								disabled={!locationForm.productId || !locationForm.location}
								class="w-full mt-4 bg-purple-600 hover:bg-purple-700"
							>
								Update Location
							</Button>
						</div>

						<!-- Create Shipment -->
						<div class="border-t border-gray-600 pt-6">
							<h3 class="text-white font-medium mb-3">🚚 Create Shipment</h3>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Product ID</label>
									<input
										bind:value={shipmentForm.productId}
										placeholder="PVC-2025-001"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Origin</label>
									<input
										bind:value={shipmentForm.origin}
										placeholder="Manufacturing Plant"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Destination</label>
									<input
										bind:value={shipmentForm.destination}
										placeholder="Distribution Center"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-300 mb-2">Carrier</label>
									<input
										bind:value={shipmentForm.carrier}
										placeholder="FedEx"
										class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
							<Button 
								onclick={createProductShipment}
								disabled={!shipmentForm.productId || !shipmentForm.origin || !shipmentForm.destination || !shipmentForm.carrier}
								class="w-full mt-4 bg-green-600 hover:bg-green-700"
							>
								Create Shipment
							</Button>
						</div>
					</div>
				</Card>

				<!-- Quick Actions & Info -->
				<Card title="⚡ Quick Actions" class="bg-gray-800 border-gray-700">
					<div class="space-y-4">
						<Button 
							variant="outline" 
							class="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
							onclick={() => goto('/manufacturer/products')}
						>
							📦 View My Products
						</Button>
						
						<Button 
							variant="outline" 
							class="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
							onclick={() => goto('/scan')}
						>
							� QR Code Generator
						</Button>
						
						<Button 
							variant="outline" 
							class="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700"
							onclick={() => goto('/marketplace')}
						>
							🏪 View Marketplace
						</Button>
					</div>

					<div class="mt-8 p-4 bg-gray-700/50 rounded-lg">
						<h3 class="text-white font-medium mb-2">🤖 ASC Features</h3>
						<ul class="text-gray-400 text-sm space-y-1">
							<li>• Autonomous quality monitoring with IoT sensors</li>
							<li>• Conditional payment automation via escrow</li>
							<li>• Smart insurance with automated claims</li>
							<li>• Immutable product provenance on Massa blockchain</li>
							<li>• IPFS metadata storage via Pinata</li>
						</ul>
					</div>
				</Card>
			</div>
		{/if}
	</div>
</PageLayout>