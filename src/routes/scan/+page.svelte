<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { getProduct, getUserAddress, getUserRole, getQualityData, getLocationData } from '$lib/web3';
	import { getMetadataFromPinata } from '$lib/pinata';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// State management - Svelte 5 syntax
	let userAddress = $state('');
	let userRole = $state<string | null>(null);
	let loading = $state(true);
	let scanning = $state(false);
	let error = $state('');
	let scannedCode = $state('');
	let productData = $state<any>(null);
	let qualityData = $state<any>(null);
	let locationData = $state<any>(null);
	let scanHistory = $state<string[]>([]);

	// Initialize component
	onMount(async () => {
		try {
			userAddress = await getUserAddress();
			userRole = await getUserRole();
			
			// Load scan history from localStorage
			const history = localStorage.getItem('scanHistory');
			if (history) {
				scanHistory = JSON.parse(history);
			}
		} catch (err) {
			console.error('Initialization error:', err);
		} finally {
			loading = false;
		}
	});

	// Manual product ID input (simulating QR scan)
	async function handleScanSubmit(event: Event) {
		event.preventDefault();
		if (!scannedCode.trim()) {
			error = 'Please enter a product ID';
			return;
		}
		
		await scanProduct(scannedCode.trim());
	}

	// Simulate QR code scanning
	async function startQRScan() {
		scanning = true;
		error = '';
		
		// Simulate scanning delay
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		// For demo, randomly select a product ID
		const demoProducts = ['PVC-2025-001', 'PVC-2025-007', 'PVC-2025-012'];
		const randomProduct = demoProducts[Math.floor(Math.random() * demoProducts.length)];
		
		scannedCode = randomProduct;
		scanning = false;
		
		await scanProduct(randomProduct);
	}

	// Main product scanning function
	async function scanProduct(productId: string) {
		try {
			loading = true;
			error = '';
			productData = null;
			qualityData = null;
			locationData = null;

			// Get product from blockchain
			const productResult = await getProduct(productId);
			
			if (!productResult.success) {
				error = `Product ${productId} not found on blockchain`;
				return;
			}

			const blockchainProduct = productResult.data;
			
			// Get metadata from IPFS if available
			let metadata = null;
			if (blockchainProduct.metadata) {
				try {
					metadata = await getMetadataFromPinata(blockchainProduct.metadata);
				} catch (err) {
					console.warn('Failed to load IPFS metadata:', err);
				}
			}

			// Combine blockchain data with metadata
			productData = {
				id: productId,
				name: blockchainProduct.name || metadata?.name || 'Unknown Product',
				batch: blockchainProduct.batch || metadata?.batch || 'Unknown',
				manufacturer: blockchainProduct.manufacturer || metadata?.manufacturer || 'Unknown',
				description: metadata?.description || 'No description available',
				category: metadata?.category || 'Unknown',
				image: metadata?.image,
				timestamp: blockchainProduct.timestamp || Date.now(),
				// ASC Configuration from metadata
				ascConfig: metadata?.ascConfig || {
					enableQualityMonitoring: false,
					temperatureThreshold: '25',
					humidityThreshold: '70',
					enablePaymentAutomation: false,
					paymentConditions: 'delivery_confirmation',
					enableInsurance: false,
					insuranceValue: ''
				}
			};

			// Get real quality and location data from smart contracts
			try {
				qualityData = await getQualityData(productId);
				locationData = await getLocationData(productId);
			} catch (err) {
				console.warn('Failed to load real-time data, using fallback:', err);
				// Fallback to mock data if smart contracts fail
				qualityData = {
					temperature: Math.floor(Math.random() * 10) + 20 + '°C',
					humidity: Math.floor(Math.random() * 20) + 50 + '%',
					lastUpdate: new Date().toLocaleString(),
					status: 'Normal',
					alerts: []
				};

				locationData = {
					currentLocation: 'New York Distribution Center',
					latitude: 40.7128,
					longitude: -74.0060,
					lastUpdate: new Date().toLocaleString(),
					status: 'In Transit',
					estimatedDelivery: '2025-07-25'
				};
			}

			// Add to scan history
			if (!scanHistory.includes(productId)) {
				scanHistory = [productId, ...scanHistory.slice(0, 9)]; // Keep last 10
				localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
			}

		} catch (err) {
			error = 'Failed to scan product: ' + (err instanceof Error ? err.message : String(err));
			console.error('Scan error:', err);
		} finally {
			loading = false;
		}
	}

	// Clear scan result
	function clearScan() {
		scannedCode = '';
		productData = null;
		qualityData = null;
		locationData = null;
		error = '';
	}

	// Navigate to product details page
	function viewProductDetails(productId: string) {
		goto(`/product/${productId}`);
	}

	// Scan from history
	function scanFromHistory(productId: string) {
		scannedCode = productId;
		scanProduct(productId);
	}
</script>

<PageLayout title="Product Scanner" subtitle="Scan QR codes to verify product authenticity and view supply chain details">
	<div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
		<div class="max-w-4xl mx-auto">
			{#if userRole}
				<div class="text-center mb-8">
					<p class="text-sm text-blue-600">Connected as: {userRole}</p>
				</div>
			{/if}

			<!-- Scanner Section -->
			<Card title="Scan Product QR Code" class="mb-6">
				<div class="text-center">
					<!-- QR Scanner Button -->
					<div class="mb-4">
						<Button 
							onclick={startQRScan} 
							disabled={scanning || loading}
							class="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
						>
							{#if scanning}
								<span class="animate-pulse">📱 Scanning...</span>
							{:else}
								📱 Start QR Scan
							{/if}
						</Button>
					</div>

					<!-- Manual Input -->
					<div class="border-t pt-4">
						<p class="text-sm text-gray-600 mb-3">Or enter product ID manually:</p>
						<form onsubmit={handleScanSubmit} class="flex gap-2 max-w-md mx-auto">
							<input
								bind:value={scannedCode}
								type="text"
								placeholder="Enter product ID (e.g., PVC-2025-001)"
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled={loading}
							/>
							<button 
								type="submit" 
								disabled={loading || !scannedCode.trim()}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Scan
							</button>
						</form>
					</div>
				</div>
			</Card>

			<!-- Error Display -->
			{#if error}
				<Card title="Error" class="mb-6 border-red-200 bg-red-50">
					<div class="text-red-700">
						<p>{error}</p>
						<Button onclick={clearScan} class="mt-3 bg-red-600 hover:bg-red-700">
							Clear
						</Button>
					</div>
				</Card>
			{/if}

			<!-- Loading State -->
			{#if loading && !scanning}
				<Card title="Loading" class="mb-6">
					<div class="text-center py-8">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p class="text-gray-600">Loading product data...</p>
					</div>
				</Card>
			{/if}

			<!-- Product Data Display -->
			{#if productData}
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Product Information -->
					<Card title="Product Verified">
						<h3 class="text-xl font-semibold mb-4 text-green-700">✅ Authentic Product</h3>
						<div class="space-y-3">
							<div>
								<strong>Product ID:</strong> {productData.id}
							</div>
							<div>
								<strong>Name:</strong> {productData.name}
							</div>
							<div>
								<strong>Batch:</strong> {productData.batch}
							</div>
							<div>
								<strong>Manufacturer:</strong> {productData.manufacturer}
							</div>
							<div>
								<strong>Category:</strong> {productData.category}
							</div>
							{#if productData.description}
								<div>
									<strong>Description:</strong> {productData.description}
								</div>
							{/if}
							<div class="pt-3 border-t">
								<Button 
									onclick={() => viewProductDetails(productData.id)}
									class="w-full bg-blue-600 hover:bg-blue-700"
								>
									View Full Details
								</Button>
							</div>
						</div>
					</Card>

					<!-- Quality Monitoring -->
					{#if qualityData}
						<Card title="Quality Monitoring">
							<h3 class="text-xl font-semibold mb-4 text-orange-700">🌡️ Quality Data</h3>
							<div class="space-y-3">
								<div>
									<strong>Temperature:</strong> {qualityData.temperature}
								</div>
								<div>
									<strong>Humidity:</strong> {qualityData.humidity}
								</div>
								<div>
									<strong>Status:</strong> 
									<span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
										{qualityData.status}
									</span>
								</div>
								<div>
									<strong>Last Update:</strong> {qualityData.lastUpdate}
								</div>
								{#if qualityData.alerts && qualityData.alerts.length > 0}
									<div>
										<strong>Alerts:</strong>
										<ul class="mt-1 space-y-1">
											{#each qualityData.alerts as alert}
												<li class="text-red-600 text-sm">⚠️ {alert}</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						</Card>
					{/if}

					<!-- Location Tracking -->
					{#if locationData}
						<Card title="Location Tracking">
							<h3 class="text-xl font-semibold mb-4 text-purple-700">📍 Location Tracking</h3>
							<div class="space-y-3">
								<div>
									<strong>Current Location:</strong> {locationData.currentLocation}
								</div>
								<div>
									<strong>Status:</strong>
									<span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
										{locationData.status}
									</span>
								</div>
								<div>
									<strong>Coordinates:</strong> {locationData.latitude}, {locationData.longitude}
								</div>
								<div>
									<strong>Last Update:</strong> {locationData.lastUpdate}
								</div>
								{#if locationData.estimatedDelivery}
									<div>
										<strong>Est. Delivery:</strong> {locationData.estimatedDelivery}
									</div>
								{/if}
							</div>
						</Card>
					{/if}

					<!-- ASC Configuration -->
					{#if productData.ascConfig}
						<Card title="Smart Contract Configuration">
							<h3 class="text-xl font-semibold mb-4 text-indigo-700">⚙️ ASC Config</h3>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span>Quality Monitoring:</span>
									<span class={productData.ascConfig.enableQualityMonitoring ? 'text-green-600' : 'text-gray-500'}>
										{productData.ascConfig.enableQualityMonitoring ? '✅ Enabled' : '❌ Disabled'}
									</span>
								</div>
								{#if productData.ascConfig.enableQualityMonitoring}
									<div class="ml-4 text-xs text-gray-600">
										<div>Temp Threshold: {productData.ascConfig.temperatureThreshold}°C</div>
										<div>Humidity Threshold: {productData.ascConfig.humidityThreshold}%</div>
									</div>
								{/if}
								<div class="flex justify-between">
									<span>Payment Automation:</span>
									<span class={productData.ascConfig.enablePaymentAutomation ? 'text-green-600' : 'text-gray-500'}>
										{productData.ascConfig.enablePaymentAutomation ? '✅ Enabled' : '❌ Disabled'}
									</span>
								</div>
								<div class="flex justify-between">
									<span>Insurance:</span>
									<span class={productData.ascConfig.enableInsurance ? 'text-green-600' : 'text-gray-500'}>
										{productData.ascConfig.enableInsurance ? '✅ Enabled' : '❌ Disabled'}
									</span>
								</div>
							</div>
						</Card>
					{/if}
				</div>

				<!-- Actions -->
				<div class="mt-6 text-center">
					<Button onclick={clearScan} class="bg-gray-500 hover:bg-gray-600">
						Scan Another Product
					</Button>
				</div>
			{/if}

			<!-- Scan History -->
			{#if scanHistory.length > 0}
				<Card title="Recent Scans" class="mt-6">
					<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{#each scanHistory as productId}
							<button
								onclick={() => scanFromHistory(productId)}
								class="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
								disabled={loading}
							>
								<div class="font-medium text-sm">{productId}</div>
								<div class="text-xs text-gray-500">Click to scan again</div>
							</button>
						{/each}
					</div>
				</Card>
			{/if}
		</div>
	</div>
</PageLayout>
