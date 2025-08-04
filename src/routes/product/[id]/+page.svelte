<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getProductById } from '$lib/services/product-service';
	import type { Product } from '$lib/types';

	// Get product ID from URL
	let productId = page.params.id;

	// Check if this is a newly minted product
	let isNewlyMinted = $derived(page.url.searchParams.get('minted') === 'true');
	let showSuccessMessage = $state(false);
	let loading = $state(true);
	let error = $state('');
	let productData = $state<Product | null>(null);

	onMount(async () => {
		try {
			// Load real product data from blockchain/IPFS
			console.log('🔍 Loading product data for ID:', productId);
			const product = await getProductById(productId);

			if (product) {
				productData = product;
				console.log('✅ Product data loaded:', product);
			} else {
				error = 'Product not found';
				console.warn('❌ Product not found:', productId);
			}
		} catch (err) {
			error = 'Failed to load product data';
			console.error('❌ Error loading product:', err);
		} finally {
			loading = false;
		}

		if (isNewlyMinted) {
			showSuccessMessage = true;
			// Hide success message after 5 seconds
			setTimeout(() => {
				showSuccessMessage = false;
			}, 5000);
		}
	});

	// Fallback mock data for missing properties - will be replaced with real blockchain data
	const mockFallbackData = {
		id: 'PVC-2025-001',
		name: 'Premium Organic Coffee Batch #2025-001',
		description:
			'Single-origin organic coffee beans from sustainable farms in Costa Rica. Hand-picked at optimal ripeness and processed using traditional methods.',
		manufacturer: 'Sustainable Farms Co.',
		manufacturerAddress: 'AS1234567890abcdef',
		status: 'Delivered',
		currentLocation: 'Brooklyn, NY Distribution Center',
		nftId: '0x1234...5678',
		tokenStandard: 'MRC-721',
		mintedDate: '2025-01-15',
		totalSupply: '1000 kg',
		currentOwner: 'AS9876543210fedcba',

		// Environmental Data
		environmentalData: {
			currentTemperature: '22°C',
			currentHumidity: '45%',
			temperatureHistory: [
				{ timestamp: '2025-02-16 14:00', value: 22 },
				{ timestamp: '2025-02-16 12:00', value: 23 },
				{ timestamp: '2025-02-16 10:00', value: 21 },
				{ timestamp: '2025-02-16 08:00', value: 20 }
			]
		},

		// Quality Assessment
		quality: {
			overall: 'Excellent',
			certifications: ['Organic', 'Fair Trade', 'Rainforest Alliance', 'SCA 85+ Score'],
			lastInspection: '2025-02-15',
			inspector: 'Certified Quality Inspectors Ltd.',
			testResults: {
				moisture: '12.5%',
				defects: '0.2%',
				cupScore: '87/100'
			}
		},

		// Complete Provenance History
		provenance: [
			{
				date: '2025-01-15',
				location: 'Costa Rica Farm - Tarrazú Region',
				event: 'Harvested',
				attester: 'Farm Manager',
				details: 'Hand-picked at optimal ripeness during peak season',
				coordinates: '9.5°N, 84.0°W',
				temperature: '18°C',
				humidity: '75%'
			},
			{
				date: '2025-01-18',
				location: 'San José Processing Facility',
				event: 'Processed',
				attester: 'Processing Supervisor',
				details: 'Washed processing method, sun-dried for 12 days',
				coordinates: '9.9°N, 84.1°W',
				temperature: '24°C',
				humidity: '60%'
			},
			{
				date: '2025-01-25',
				location: 'Quality Control Lab',
				event: 'Quality Tested',
				attester: 'QC Inspector',
				details: 'SCA cupping score: 87/100, Grade A quality',
				temperature: '22°C',
				humidity: '55%'
			},
			{
				date: '2025-02-01',
				location: 'Port of San José - Warehouse',
				event: 'Packed for Export',
				attester: 'Export Manager',
				details: 'Vacuum sealed in 60kg bags, loaded into refrigerated container',
				temperature: '20°C',
				humidity: '50%'
			},
			{
				date: '2025-02-02',
				location: 'Port of San José',
				event: 'Shipped',
				attester: 'Shipping Agent',
				details: 'Container #CSQU3054321 loaded on vessel MV Coffee Trader',
				temperature: '18°C',
				humidity: '45%'
			},
			{
				date: '2025-02-15',
				location: 'Port of Newark - Container Terminal',
				event: 'Arrived in USA',
				attester: 'Port Authority',
				details: 'Container cleared customs, temperature maintained',
				coordinates: '40.7°N, 74.2°W',
				temperature: '20°C',
				humidity: '48%'
			},
			{
				date: '2025-02-16',
				location: 'Brooklyn Distribution Center',
				event: 'Final Delivery',
				attester: 'Distribution Manager',
				details: 'Quality inspection passed, ready for retail distribution',
				coordinates: '40.6°N, 74.0°W',
				temperature: '22°C',
				humidity: '45%'
			}
		],

		// Smart Contract Events
		smartContractEvents: [
			{
				event: 'Transfer',
				from: 'AS1234567890abcdef',
				to: 'AS9876543210fedcba',
				timestamp: '2025-02-16 15:30',
				txHash: '0xabc123...'
			},
			{
				event: 'PaymentReleased',
				amount: '$25,000',
				recipient: 'AS5555666677778888',
				timestamp: '2025-02-16 15:31',
				txHash: '0xdef456...'
			},
			{
				event: 'QualityCheckPassed',
				inspector: 'AS4444333322221111',
				score: '87',
				timestamp: '2025-02-15 14:20',
				txHash: '0x789ghi...'
			}
		],

		// IPFS & Arweave Links
		attachments: {
			images: [
				'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop&crop=center'
			], // Using a real placeholder image for demo
			certificates: ['ar://kL8K7P9M2N1X5Y6Z3A4B7C8D9E0F1G2H3I4J5K6L7M8N'],
			testReports: [
				'https://gateway.pinata.cloud/ipfs/QmNhz8K6P2M9X3Y4Z1A2B5C6D7E8F9G0H1I2J3K4L5M6N'
			]
		}
	};

	// Merge real product data with fallback mock data
	let displayData = $derived.by(() => {
		if (!productData) return mockFallbackData;

		return {
			...mockFallbackData,
			// Override with real data when available
			id: productData.id || mockFallbackData.id,
			name: productData.name || mockFallbackData.name,
			description: productData.description || mockFallbackData.description,
			manufacturer: productData.manufacturer || mockFallbackData.manufacturer,
			batch: productData.batch,
			quantity: productData.quantity,
			category: productData.category,
			mintedDate: productData.mintedAt || mockFallbackData.mintedDate,
			price: productData.price,
			ipfsHash: productData.ipfsHash,
			// Add real product image if available
			attachments: {
				...mockFallbackData.attachments,
				images: productData.image
					? [`https://gateway.pinata.cloud/ipfs/${productData.image}`]
					: mockFallbackData.attachments.images
			}
		};
	});

	// Add debugging for image URL
	$effect(() => {
		if (productData?.image) {
			console.log('🖼️ Product has real image data');
			console.log('📂 Product image hash:', productData.image);
			console.log('🔗 Full image URL:', `https://gateway.pinata.cloud/ipfs/${productData.image}`);
		} else {
			console.log('📷 No product image data, using mock fallback');
			console.log('🔗 Mock image URL:', mockFallbackData.attachments.images[0]);
			console.log('💡 This is expected for products without uploaded images');
		}
	});

	// Function to handle image loading with fallback gateways
	function handleImageError(e: Event, imageHash: string) {
		const target = e.target as HTMLImageElement;
		if (!target) return;

		console.error('Failed to load image from current gateway, trying fallback...');

		// Try alternative IPFS gateways
		const fallbackGateways = [
			`https://gateway.pinata.cloud/ipfs/${imageHash}`,
			`https://ipfs.io/ipfs/${imageHash}`,
			`https://cloudflare-ipfs.com/ipfs/${imageHash}`,
			`https://dweb.link/ipfs/${imageHash}`
		];

		const currentSrc = target.src;
		let currentGatewayIndex = -1;

		// Find which gateway is currently being used
		for (let i = 0; i < fallbackGateways.length; i++) {
			if (currentSrc === fallbackGateways[i]) {
				currentGatewayIndex = i;
				break;
			}
		}

		if (currentGatewayIndex < fallbackGateways.length - 1) {
			// Try next fallback gateway
			const nextGateway = fallbackGateways[currentGatewayIndex + 1];
			console.log('🔄 Trying fallback gateway:', nextGateway);
			target.src = nextGateway;
		} else {
			// All gateways failed, hide the image
			console.error('❌ All IPFS gateways failed for image:', imageHash);
			target.style.display = 'none';
		}
	}

	// Function to extract IPFS hash from various URL formats
	function extractIPFSHash(url: string): string | null {
		// Handle ipfs:// protocol URLs
		if (url.startsWith('ipfs://')) {
			return url.replace('ipfs://', '');
		}

		// Handle HTTP gateway URLs
		const gatewayMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)$/);
		if (gatewayMatch) {
			return gatewayMatch[1];
		}

		return null;
	}

	let activeTab = $state('overview');
	let showQRCode = $state(false);

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'delivered':
				return 'text-green-400';
			case 'in transit':
				return 'text-blue-400';
			case 'quality check':
				return 'text-yellow-400';
			default:
				return 'text-gray-400';
		}
	};

	const formatAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};
</script>

<svelte:head>
	<title>Product {displayData?.id || productId} - ProviChain</title>
</svelte:head>

<PageLayout
	title="Product Verification"
	subtitle="Immutable supply chain history and real-time status"
>
	{#if loading}
		<div class="flex items-center justify-center py-16">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-400"
				></div>
				<div class="text-lg text-green-400">Loading product data...</div>
			</div>
		</div>
	{:else if error}
		<div class="mb-8">
			<div
				class="rounded-xl border border-red-500/50 bg-gradient-to-r from-red-900/30 to-red-800/30 p-6"
			>
				<div class="text-center">
					<div class="mb-3 text-5xl">❌</div>
					<h2 class="mb-2 text-xl font-bold text-white">Product Not Found</h2>
					<p class="mb-4 text-gray-300">{error}</p>
					<p class="text-sm text-gray-400">Product ID: {productId}</p>
				</div>
			</div>
		</div>
	{:else if displayData}
		<!-- Success Message for Newly Minted Products -->
		{#if showSuccessMessage}
			<div class="mb-8">
				<div
					class="rounded-xl border border-green-500/50 bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-6"
				>
					<div class="text-center">
						<div class="mb-3 text-5xl">🎉</div>
						<h2 class="mb-2 text-xl font-bold text-white">Product Successfully Minted!</h2>
						<p class="mb-4 text-gray-300">
							Your product has been successfully tokenized and stored on the Massa blockchain.
						</p>
						<div class="inline-block rounded-lg bg-gray-800/50 p-3">
							<div class="text-sm text-gray-400">Product ID</div>
							<div class="font-mono text-green-400">{productId}</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Product Header -->
		<section class="mb-8">
			<div
				class="rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-8"
			>
				<div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
					<div class="flex-1">
						<div class="mb-4 flex items-center gap-3">
							<div class="h-3 w-3 animate-pulse rounded-full bg-green-400"></div>
							<span class="text-sm font-medium tracking-wide text-green-400 uppercase"
								>Verified Authentic</span
							>
						</div>
						<h1 class="mb-2 text-3xl font-bold text-white">{displayData.name}</h1>
						<p class="mb-4 text-gray-300">{displayData.description}</p>

						<div class="mb-6 grid gap-4 md:grid-cols-3">
							<div>
								<p class="text-sm text-gray-400">Product ID</p>
								<p class="font-mono text-white">{displayData.id}</p>
							</div>
							<div>
								<p class="text-sm text-gray-400">Status</p>
								<p class="font-semibold {getStatusColor(displayData.status)}">
									{displayData.status}
								</p>
							</div>
							<div>
								<p class="text-sm text-gray-400">Current Location</p>
								<p class="text-white">{displayData.currentLocation}</p>
							</div>
						</div>

						<div class="flex flex-wrap gap-2">
							{#each displayData.quality.certifications as cert}
								<span class="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
									{cert}
								</span>
							{/each}
						</div>
					</div>

					<div class="text-center">
						<!-- Product Image Display -->
						{#if productData?.image}
							<div class="mb-4">
								<img
									src="https://gateway.pinata.cloud/ipfs/${productData.image}"
									alt="Product: {displayData.name}"
									class="mx-auto h-48 w-48 rounded-xl border border-gray-600 object-cover shadow-lg"
									loading="lazy"
									onerror={(e) => {
										if (productData?.image) {
											handleImageError(e, productData.image);
										}
									}}
								/>
								<p class="mt-2 text-xs text-gray-400">Product Image</p>
							</div>
						{:else if displayData.attachments.images.length > 0}
							<div class="mb-4">
								<img
									src={displayData.attachments.images[0]}
									alt="Product: {displayData.name}"
									class="mx-auto h-48 w-48 rounded-xl border border-gray-600 object-cover shadow-lg"
									loading="lazy"
								/>
								<p class="mt-1 text-xs text-gray-400">Demo Image</p>
								<span
									class="inline-block rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400"
								>
									Placeholder
								</span>
							</div>
						{/if}

						<Button onclick={() => (showQRCode = !showQRCode)} variant="outline" class="mb-4">
							{showQRCode ? 'Hide' : 'Show'} QR Code
						</Button>

						{#if showQRCode}
							<div class="inline-block rounded-lg bg-white p-4">
								<div class="flex h-32 w-32 items-center justify-center bg-black text-xs text-white">
									QR CODE<br />for<br />{displayData.id}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- Tab Navigation -->
		<section class="mb-6">
			<div class="border-b border-gray-700">
				<nav class="flex space-x-8">
					{#each [{ id: 'overview', label: 'Overview' }, { id: 'provenance', label: 'Provenance' }, { id: 'quality', label: 'Quality' }, { id: 'environmental', label: 'Environmental' }, { id: 'blockchain', label: 'Blockchain' }] as tab}
						<button
							onclick={() => (activeTab = tab.id)}
							class="border-b-2 px-1 py-2 text-sm font-medium transition-colors {activeTab ===
							tab.id
								? 'border-green-500 text-green-400'
								: 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300'}"
						>
							{tab.label}
						</button>
					{/each}
				</nav>
			</div>
		</section>

		<!-- Tab Content -->
		{#if activeTab === 'overview'}
			<div class="grid gap-6 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-2">
					<Card title="Product Information" description="Basic details and current status">
						<div class="grid gap-6 md:grid-cols-2">
							<div class="space-y-4">
								<div>
									<p class="text-sm text-gray-400">Manufacturer</p>
									<p class="font-semibold text-white">{displayData.manufacturer}</p>
									<p class="font-mono text-xs text-gray-400">
										{formatAddress(displayData.manufacturerAddress)}
									</p>
								</div>
								<div>
									<p class="text-sm text-gray-400">Total Supply</p>
									<p class="text-white">{displayData.totalSupply}</p>
								</div>
								<div>
									<p class="text-sm text-gray-400">Minted Date</p>
									<p class="text-white">{displayData.mintedDate}</p>
								</div>
							</div>
							<div class="space-y-4">
								<div>
									<p class="text-sm text-gray-400">Current Owner</p>
									<p class="font-mono text-white">{formatAddress(displayData.currentOwner)}</p>
								</div>
								<div>
									<p class="text-sm text-gray-400">NFT Standard</p>
									<p class="text-white">{displayData.tokenStandard}</p>
								</div>
								<div>
									<p class="text-sm text-gray-400">Token ID</p>
									<p class="font-mono text-white">{displayData.nftId}</p>
								</div>
							</div>
						</div>
					</Card>

					<Card title="Current Environmental Conditions" description="Live sensor data">
						<div class="grid gap-6 md:grid-cols-2">
							<div class="text-center">
								<div class="mb-2 text-4xl font-bold text-blue-400">
									{displayData.environmentalData.currentTemperature}
								</div>
								<p class="text-gray-400">Temperature</p>
							</div>
							<div class="text-center">
								<div class="mb-2 text-4xl font-bold text-cyan-400">
									{displayData.environmentalData.currentHumidity}
								</div>
								<p class="text-gray-400">Humidity</p>
							</div>
						</div>
					</Card>
				</div>

				<div class="space-y-6">
					{#if displayData && displayData.attachments && displayData.attachments.images && displayData.attachments.images.length > 0}
						<Card
							title="Product Image"
							description={productData?.image ? 'Uploaded product image' : 'Demo placeholder image'}
						>
							<div class="aspect-square overflow-hidden rounded-lg">
								<img
									src={displayData.attachments.images[0]}
									alt="{displayData.name} product image"
									class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
									onerror={(e) => {
										const imageUrl = displayData.attachments.images[0];
										const ipfsHash = extractIPFSHash(imageUrl);
										if (ipfsHash) {
											handleImageError(e, ipfsHash);
										} else {
											console.error('Could not extract IPFS hash from URL:', imageUrl);
											const target = e.target as HTMLImageElement;
											if (target) target.style.display = 'none';
										}
									}}
								/>
							</div>
							{#if !productData?.image}
								<div class="mt-2 text-center">
									<span
										class="inline-block rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400"
									>
										Demo Image
									</span>
								</div>
							{/if}
						</Card>
					{/if}

					<Card title="Quality Score" description="Overall product quality assessment">
						<div class="mb-6 text-center">
							<div class="mb-2 text-5xl font-bold text-green-400">
								{displayData.quality.overall}
							</div>
							<p class="text-gray-400">Quality Grade</p>
						</div>

						<div class="space-y-3">
							<div class="flex justify-between">
								<span class="text-gray-300">Last Inspection</span>
								<span class="text-white">{displayData.quality.lastInspection}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-300">Inspector</span>
								<span class="text-sm text-white">{displayData.quality.inspector}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-300">Cup Score</span>
								<span class="font-semibold text-green-400"
									>{displayData.quality.testResults.cupScore}</span
								>
							</div>
						</div>
					</Card>

					<Card title="Actions" description="Available actions for this product">
						<div class="space-y-3">
							<Button href="/consumer" class="w-full">Add to Watchlist</Button>
							<Button href="/scan" variant="outline" class="w-full">Scan Another Product</Button>
							<Button href="/" variant="ghost" class="w-full">Back to Home</Button>
						</div>
					</Card>
				</div>
			</div>
		{:else if activeTab === 'provenance'}
			<Card
				title="Complete Supply Chain Journey"
				description="Immutable history of this product's journey"
			>
				<div class="space-y-6">
					{#each displayData.provenance as event, i}
						<div class="flex items-start space-x-4">
							<div class="flex flex-col items-center">
								<div class="h-4 w-4 rounded-full bg-green-500"></div>
								{#if i < displayData.provenance.length - 1}
									<div class="mt-2 h-16 w-px bg-gray-600"></div>
								{/if}
							</div>
							<div class="flex-1 rounded-lg bg-gray-800 p-4">
								<div class="mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
									<h3 class="font-semibold text-white">{event.event}</h3>
									<span class="text-sm text-gray-400">{event.date}</span>
								</div>
								<p class="mb-2 text-gray-300">{event.location}</p>
								<p class="mb-3 text-sm text-gray-400">{event.details}</p>

								<div class="grid gap-4 text-sm md:grid-cols-3">
									<div>
										<p class="text-gray-400">Attester</p>
										<p class="text-white">{event.attester}</p>
									</div>
									{#if event.temperature}
										<div>
											<p class="text-gray-400">Temperature</p>
											<p class="text-blue-400">{event.temperature}</p>
										</div>
									{/if}
									{#if event.humidity}
										<div>
											<p class="text-gray-400">Humidity</p>
											<p class="text-cyan-400">{event.humidity}</p>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		{:else if activeTab === 'quality'}
			<div class="grid gap-6 lg:grid-cols-2">
				<Card title="Quality Certifications" description="Official certifications and compliance">
					<div class="space-y-4">
						{#each displayData.quality.certifications as cert}
							<div class="flex items-center space-x-3 rounded-lg bg-gray-800 p-3">
								<div class="h-3 w-3 rounded-full bg-green-400"></div>
								<span class="text-white">{cert}</span>
							</div>
						{/each}
					</div>
				</Card>

				<Card title="Test Results" description="Detailed quality assessment">
					<div class="space-y-4">
						<div class="flex items-center justify-between rounded-lg bg-gray-800 p-3">
							<span class="text-gray-300">Moisture Content</span>
							<span class="font-semibold text-blue-400"
								>{displayData.quality.testResults.moisture}</span
							>
						</div>
						<div class="flex items-center justify-between rounded-lg bg-gray-800 p-3">
							<span class="text-gray-300">Defect Rate</span>
							<span class="font-semibold text-green-400"
								>{displayData.quality.testResults.defects}</span
							>
						</div>
						<div class="flex items-center justify-between rounded-lg bg-gray-800 p-3">
							<span class="text-gray-300">SCA Cup Score</span>
							<span class="font-semibold text-green-400"
								>{displayData.quality.testResults.cupScore}</span
							>
						</div>
					</div>
				</Card>
			</div>
		{:else if activeTab === 'environmental'}
			<Card
				title="Environmental Monitoring"
				description="Real-time and historical environmental data"
			>
				<div class="mb-6 grid gap-6 md:grid-cols-2">
					<div class="rounded-lg bg-gray-800 p-6 text-center">
						<div class="mb-2 text-4xl">🌡️</div>
						<div class="mb-2 text-3xl font-bold text-blue-400">
							{displayData.environmentalData.currentTemperature}
						</div>
						<p class="text-gray-400">Current Temperature</p>
					</div>
					<div class="rounded-lg bg-gray-800 p-6 text-center">
						<div class="mb-2 text-4xl">💧</div>
						<div class="mb-2 text-3xl font-bold text-cyan-400">
							{displayData.environmentalData.currentHumidity}
						</div>
						<p class="text-gray-400">Current Humidity</p>
					</div>
				</div>

				<div class="rounded-lg bg-gray-800 p-6">
					<h3 class="mb-4 text-lg font-semibold text-white">Temperature History</h3>
					<div class="space-y-2">
						{#each displayData.environmentalData.temperatureHistory as reading}
							<div class="flex items-center justify-between rounded bg-gray-700 p-2">
								<span class="text-gray-300">{reading.timestamp}</span>
								<span class="font-semibold text-blue-400">{reading.value}°C</span>
							</div>
						{/each}
					</div>
				</div>
			</Card>
		{:else if activeTab === 'blockchain'}
			<div class="space-y-6">
				<Card title="Smart Contract Events" description="On-chain transaction history">
					<div class="space-y-4">
						{#each displayData.smartContractEvents as event}
							<div class="rounded-lg bg-gray-800 p-4">
								<div class="mb-2 flex items-start justify-between">
									<span class="font-semibold text-white">{event.event}</span>
									<span class="text-sm text-gray-400">{event.timestamp}</span>
								</div>

								{#if event.from && event.to}
									<div class="text-sm">
										<p class="text-gray-400">
											From: <span class="font-mono text-white">{formatAddress(event.from)}</span>
										</p>
										<p class="text-gray-400">
											To: <span class="font-mono text-white">{formatAddress(event.to)}</span>
										</p>
									</div>
								{/if}

								{#if event.amount}
									<p class="font-semibold text-green-400">{event.amount}</p>
								{/if}

								{#if event.score}
									<p class="text-blue-400">Quality Score: {event.score}/100</p>
								{/if}

								<p class="mt-2 font-mono text-xs text-gray-500">{event.txHash}</p>
							</div>
						{/each}
					</div>
				</Card>

				<Card title="File Attachments" description="IPFS and Arweave storage links">
					<div class="space-y-4">
						<div>
							<h4 class="mb-2 font-semibold text-white">Product Images</h4>
							{#each displayData.attachments.images as image}
								<a
									href={image}
									target="_blank"
									class="block font-mono text-sm text-blue-400 hover:text-blue-300"
								>
									{image}
								</a>
							{/each}
						</div>
						<div>
							<h4 class="mb-2 font-semibold text-white">Certificates</h4>
							{#each displayData.attachments.certificates as cert}
								<a
									href={cert}
									target="_blank"
									class="block font-mono text-sm text-blue-400 hover:text-blue-300"
								>
									{cert}
								</a>
							{/each}
						</div>
						<div>
							<h4 class="mb-2 font-semibold text-white">Test Reports</h4>
							{#each displayData.attachments.testReports as report}
								<a
									href={report}
									target="_blank"
									class="block font-mono text-sm text-blue-400 hover:text-blue-300"
								>
									{report}
								</a>
							{/each}
						</div>
					</div>
				</Card>
			</div>
		{/if}
	{/if}
</PageLayout>
