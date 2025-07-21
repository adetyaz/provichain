<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { onMount } from 'svelte';

	let scannedCode = $state('');
	let isScanning = $state(false);
	let productData = $state<any>(null);
	let scanHistory = $state<string[]>([]);

	// Mock product data
	const mockProducts: Record<string, any> = {
		'PVC-2025-001': {
			id: 'PVC-2025-001',
			name: 'Premium Organic Coffee Batch #2025-001',
			manufacturer: 'Sustainable Farms Co.',
			status: 'Delivered',
			currentLocation: 'Brooklyn, NY Distribution Center',
			temperature: '22°C',
			humidity: '45%',
			quality: 'Excellent',
			provenance: [
				{ date: '2025-01-15', location: 'Costa Rica Farm', event: 'Harvested' },
				{ date: '2025-01-20', location: 'San José Processing', event: 'Processed' },
				{ date: '2025-02-01', location: 'Port of San José', event: 'Shipped' },
				{ date: '2025-02-15', location: 'Port of Newark', event: 'Arrived' },
				{ date: '2025-02-16', location: 'Brooklyn Distribution', event: 'Delivered' }
			],
			certifications: ['Organic', 'Fair Trade', 'Rainforest Alliance'],
			nftId: '0x1234...5678'
		},
		'PVC-2025-002': {
			id: 'PVC-2025-002',
			name: 'Luxury Watch - Swiss Made',
			manufacturer: 'Alpine Timepieces',
			status: 'In Transit',
			currentLocation: 'Swiss Customs',
			temperature: '20°C',
			quality: 'Perfect',
			provenance: [
				{ date: '2025-02-01', location: 'Geneva Workshop', event: 'Manufactured' },
				{ date: '2025-02-10', location: 'Quality Control', event: 'Tested' },
				{ date: '2025-02-15', location: 'Zurich Logistics', event: 'Shipped' }
			],
			certifications: ['Swiss Made', 'COSC Certified'],
			nftId: '0x5678...9012'
		}
	};

	const handleScan = (productId?: string) => {
		isScanning = true;
		const id = productId || scannedCode;
		
		setTimeout(() => {
			if (mockProducts[id]) {
				productData = mockProducts[id];
				if (!scanHistory.includes(id)) {
					scanHistory = [id, ...scanHistory];
				}
			} else {
				productData = null;
			}
			isScanning = false;
		}, 1500);
	};

	const handleQuickScan = (productId: string) => {
		scannedCode = productId;
		handleScan(productId);
	};

	onMount(() => {
		// Load scan history from localStorage
		const stored = localStorage.getItem('provichain-scan-history');
		if (stored) {
			scanHistory = JSON.parse(stored);
		}
	});

	// Save history when it changes
	$effect(() => {
		localStorage.setItem('provichain-scan-history', JSON.stringify(scanHistory));
	});
</script>

<PageLayout 
	title="Product Verification" 
	subtitle="Scan QR codes or enter product IDs to verify authenticity and view provenance"
	maxWidth="2xl"
>
	<div class="grid lg:grid-cols-2 gap-8">
		<!-- Scanner Section -->
		<div class="space-y-6">
			<Card title="Scan Product" description="Enter product ID or scan QR code">
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Product ID</label>
						<input
							bind:value={scannedCode}
							placeholder="e.g., PVC-2025-001"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
						/>
					</div>

					<Button 
						onclick={() => handleScan()} 
						loading={isScanning}
						disabled={!scannedCode || isScanning}
						class="w-full" 
						size="lg"
					>
						{isScanning ? 'Verifying...' : 'Verify Product'}
					</Button>

					<div class="text-center">
						<p class="text-gray-400 text-sm mb-4">Or try these demo products:</p>
						<div class="flex flex-wrap gap-2">
							<Button 
								onclick={() => handleQuickScan('PVC-2025-001')} 
								variant="outline" 
								size="sm"
							>
								Coffee Batch
							</Button>
							<Button 
								onclick={() => handleQuickScan('PVC-2025-002')} 
								variant="outline" 
								size="sm"
							>
								Swiss Watch
							</Button>
						</div>
					</div>
				</div>
			</Card>

			<!-- QR Scanner Placeholder -->
			<Card title="QR Code Scanner" description="Use your camera to scan product QR codes">
				<div class="aspect-square bg-gray-800 rounded-lg flex items-center justify-center mb-4">
					<div class="text-center">
						<div class="text-6xl mb-4">📱</div>
						<p class="text-gray-400">QR Scanner</p>
						<p class="text-gray-500 text-sm">Camera integration coming soon</p>
					</div>
				</div>
				<Button variant="outline" class="w-full" disabled>
					Enable Camera
				</Button>
			</Card>
		</div>

		<!-- Results Section -->
		<div class="space-y-6">
			{#if isScanning}
				<Card title="Verifying..." description="Checking blockchain records">
					<div class="flex items-center justify-center py-12">
						<div class="text-center">
							<svg class="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
							<p class="text-gray-300">Verifying on Massa blockchain...</p>
						</div>
					</div>
				</Card>
			{:else if productData}
				<!-- Product Found -->
				<Card title="✅ Product Verified" description="Authentic product found on blockchain">
					<div class="space-y-6">
						<!-- Product Info -->
						<div class="bg-gray-800 rounded-lg p-4">
							<h3 class="font-bold text-white text-lg mb-2">{productData.name}</h3>
							<p class="text-gray-300">by {productData.manufacturer}</p>
							<div class="mt-3 flex flex-wrap gap-2">
								{#each productData.certifications as cert}
									<span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
										{cert}
									</span>
								{/each}
							</div>
						</div>

						<!-- Status & Location -->
						<div class="grid grid-cols-2 gap-4">
							<div class="bg-gray-800 rounded-lg p-4">
								<p class="text-gray-400 text-sm">Status</p>
								<p class="text-white font-semibold">{productData.status}</p>
							</div>
							<div class="bg-gray-800 rounded-lg p-4">
								<p class="text-gray-400 text-sm">Quality</p>
								<p class="text-green-400 font-semibold">{productData.quality}</p>
							</div>
						</div>

						<div class="bg-gray-800 rounded-lg p-4">
							<p class="text-gray-400 text-sm">Current Location</p>
							<p class="text-white">{productData.currentLocation}</p>
						</div>

						<!-- Environmental Data -->
						{#if productData.temperature}
							<div class="grid grid-cols-2 gap-4">
								<div class="bg-gray-800 rounded-lg p-4">
									<p class="text-gray-400 text-sm">Temperature</p>
									<p class="text-blue-400 font-semibold">{productData.temperature}</p>
								</div>
								{#if productData.humidity}
									<div class="bg-gray-800 rounded-lg p-4">
										<p class="text-gray-400 text-sm">Humidity</p>
										<p class="text-blue-400 font-semibold">{productData.humidity}</p>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex flex-col sm:flex-row gap-3">
							<Button href="/product/{productData.id}" class="flex-1">
								View Full Details
							</Button>
							<Button href="/consumer" variant="outline" class="flex-1">
								Add to Watchlist
							</Button>
						</div>
					</div>
				</Card>
			{:else if scannedCode && !isScanning}
				<!-- Product Not Found -->
				<Card title="❌ Product Not Found" description="No matching product found on blockchain">
					<div class="text-center py-8">
						<div class="text-6xl mb-4">🔍</div>
						<p class="text-gray-300 mb-4">
							Product ID "<span class="font-mono text-green-400">{scannedCode}</span>" not found
						</p>
						<p class="text-gray-400 text-sm mb-6">
							This could mean the product hasn't been tokenized yet, or the ID is incorrect.
						</p>
						<div class="flex flex-col sm:flex-row gap-3 justify-center">
							<Button variant="outline" onclick={() => { scannedCode = ''; productData = null; }}>
								Try Another ID
							</Button>
							<Button href="/manufacturer/launchpad" variant="ghost">
								Tokenize Product
							</Button>
						</div>
					</div>
				</Card>
			{:else}
				<!-- Initial State -->
				<Card title="Product Information" description="Enter a product ID to see verification results">
					<div class="text-center py-12">
						<div class="text-6xl mb-4">📦</div>
						<p class="text-gray-400">Enter a product ID to verify authenticity</p>
					</div>
				</Card>
			{/if}

			<!-- Scan History -->
			{#if scanHistory.length > 0}
				<Card title="Recent Scans" description="Your recently verified products">
					<div class="space-y-2 max-h-64 overflow-y-auto">
						{#each scanHistory.slice(0, 5) as historyItem}
							<button
								onclick={() => handleQuickScan(historyItem)}
								class="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
							>
								<div class="flex items-center justify-between">
									<span class="font-mono text-sm text-green-400">{historyItem}</span>
									<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</div>
							</button>
						{/each}
					</div>
				</Card>
			{/if}
		</div>
	</div>
</PageLayout>
