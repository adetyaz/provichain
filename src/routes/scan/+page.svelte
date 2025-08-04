<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { onMount } from 'svelte';
	import { getProduct } from '$lib/utils';

	let scannedCode = $state('');
	let isScanning = $state(false);
	let productData = $state<any>(null);
	let scanHistory = $state<string[]>([]);
	let error = $state('');

	// Load scan history from localStorage
	onMount(() => {
		const stored = localStorage.getItem('scan-history');
		if (stored) {
			try {
				scanHistory = JSON.parse(stored);
			} catch (e) {
				console.warn('Failed to parse scan history');
			}
		}
	});

	const handleScan = async (productId?: string) => {
		isScanning = true;
		error = '';
		const id = productId || scannedCode;

		try {
			const result = await getProduct(id);
			if (result.success && result.data) {
				productData = {
					...result.data,
					// Add some mock tracking data for demonstration
					currentLocation: 'Distribution Center',
					temperature: '22°C',
					humidity: '45%',
					quality: 'Excellent',
					provenance: [
						{
							date: new Date(result.data.mintedAt).toISOString().split('T')[0],
							location: 'Manufacturer',
							event: 'Minted'
						},
						{
							date: new Date().toISOString().split('T')[0],
							location: 'Current Location',
							event: 'Tracked'
						}
					],
					certifications: ['Blockchain Verified'],
					nftId: result.data.id || 'N/A'
				};

				// Add to scan history
				if (!scanHistory.includes(id)) {
					scanHistory = [id, ...scanHistory.slice(0, 9)]; // Keep last 10 scans
					localStorage.setItem('scan-history', JSON.stringify(scanHistory));
				}
			} else {
				productData = null;
				error = 'Product not found or invalid ID';
			}
		} catch (err) {
			console.error('Error scanning product:', err);
			productData = null;
			error = 'Failed to scan product. Please try again.';
		} finally {
			isScanning = false;
		}
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
	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Scanner Section -->
		<div class="space-y-6">
			<Card title="Scan Product" description="Enter product ID or scan QR code">
				<div class="space-y-4">
					<div>
						<label for="product-id-scan" class="mb-2 block text-sm font-medium text-white"
							>Product ID</label
						>
						<input
							id="product-id-scan"
							bind:value={scannedCode}
							placeholder="e.g., PVC-2025-001"
							class="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
						/>
					</div>

					<Button onclick={() => handleScan()} loading={isScanning} class="w-full" size="lg">
						{isScanning ? 'Verifying...' : 'Verify Product'}
					</Button>

					{#if error}
						<div class="rounded-lg border border-red-500 bg-red-900/20 p-3 text-sm text-red-400">
							{error}
						</div>
					{/if}

					{#if scanHistory.length > 0}
						<div class="text-center">
							<p class="mb-4 text-sm text-gray-400">Recent scans:</p>
							<div class="flex flex-wrap gap-2">
								{#each scanHistory.slice(0, 3) as productId}
									<Button onclick={() => handleQuickScan(productId)} variant="outline" size="sm">
										{productId.slice(-8)}
									</Button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</Card>

			<!-- QR Scanner Placeholder -->
			<Card title="QR Code Scanner" description="Use your camera to scan product QR codes">
				<div class="mb-4 flex aspect-square items-center justify-center rounded-lg bg-gray-800">
					<div class="text-center">
						<div class="mb-4 text-6xl">📱</div>
						<p class="text-gray-200">QR Scanner</p>
						<p class="text-sm text-gray-300">Camera integration coming soon</p>
					</div>
				</div>
				<Button variant="outline" class="w-full">Enable Camera</Button>
			</Card>
		</div>

		<!-- Results Section -->
		<div class="space-y-6">
			{#if isScanning}
				<Card title="Verifying..." description="Checking blockchain records">
					<div class="flex items-center justify-center py-12">
						<div class="text-center">
							<svg
								class="mx-auto mb-4 h-12 w-12 animate-spin text-green-500"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
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
						<div class="rounded-lg bg-gray-800 p-4">
							<h3 class="mb-2 text-lg font-bold text-white">{productData.name}</h3>
							<p class="text-gray-300">by {productData.manufacturer}</p>
							<div class="mt-3 flex flex-wrap gap-2">
								{#each productData.certifications as cert}
									<span class="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
										{cert}
									</span>
								{/each}
							</div>
						</div>

						<!-- Status & Location -->
						<div class="grid grid-cols-2 gap-4">
							<div class="rounded-lg bg-gray-800 p-4">
								<p class="text-sm text-gray-400">Status</p>
								<p class="font-semibold text-white">{productData.status}</p>
							</div>
							<div class="rounded-lg bg-gray-800 p-4">
								<p class="text-sm text-gray-400">Quality</p>
								<p class="font-semibold text-green-400">{productData.quality}</p>
							</div>
						</div>

						<div class="rounded-lg bg-gray-800 p-4">
							<p class="text-sm text-gray-400">Current Location</p>
							<p class="text-white">{productData.currentLocation}</p>
						</div>

						<!-- Environmental Data -->
						{#if productData.temperature}
							<div class="grid grid-cols-2 gap-4">
								<div class="rounded-lg bg-gray-800 p-4">
									<p class="text-sm text-gray-400">Temperature</p>
									<p class="font-semibold text-blue-400">{productData.temperature}</p>
								</div>
								{#if productData.humidity}
									<div class="rounded-lg bg-gray-800 p-4">
										<p class="text-sm text-gray-400">Humidity</p>
										<p class="font-semibold text-blue-400">{productData.humidity}</p>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex flex-col gap-3 sm:flex-row">
							<Button href="/product/{productData.id}" class="flex-1">View Full Details</Button>
							<Button href="/consumer" variant="outline" class="flex-1">Add to Watchlist</Button>
						</div>
					</div>
				</Card>
			{:else if scannedCode && !isScanning}
				<!-- Product Not Found -->
				<Card title="❌ Product Not Found" description="No matching product found on blockchain">
					<div class="py-8 text-center">
						<div class="mb-4 text-6xl">🔍</div>
						<p class="mb-4 text-gray-300">
							Product ID "<span class="font-mono text-green-400">{scannedCode}</span>" not found
						</p>
						<p class="mb-6 text-sm text-gray-400">
							This could mean the product hasn't been tokenized yet, or the ID is incorrect.
						</p>
						<div class="flex flex-col justify-center gap-3 sm:flex-row">
							<Button
								variant="outline"
								onclick={() => {
									scannedCode = '';
									productData = null;
								}}
							>
								Try Another ID
							</Button>
							<Button href="/manufacturer" variant="ghost">Tokenize Product</Button>
						</div>
					</div>
				</Card>
			{:else}
				<!-- Initial State -->
				<Card
					title="Product Information"
					description="Enter a product ID to see verification results"
				>
					<div class="py-12 text-center">
						<div class="mb-4 text-6xl">📦</div>
						<p class="text-gray-400">Enter a product ID to verify authenticity</p>
					</div>
				</Card>
			{/if}

			<!-- Scan History -->
			{#if scanHistory.length > 0}
				<Card title="Recent Scans" description="Your recently verified products">
					<div class="max-h-64 space-y-2 overflow-y-auto">
						{#each scanHistory.slice(0, 5) as historyItem}
							<button
								onclick={() => handleQuickScan(historyItem)}
								class="w-full rounded-lg bg-gray-800 p-3 text-left transition-colors hover:bg-gray-700"
							>
								<div class="flex items-center justify-between">
									<span class="font-mono text-sm text-green-400">{historyItem}</span>
									<svg
										class="h-4 w-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/>
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
