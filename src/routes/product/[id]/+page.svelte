<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { page } from '$app/stores';

	// Get product ID from URL
	let productId = $page.params.id;

	// Mock product data - in real app, this would be fetched from blockchain
	const productData = {
		id: 'PVC-2025-001',
		name: 'Premium Organic Coffee Batch #2025-001',
		description: 'Single-origin organic coffee beans from sustainable farms in Costa Rica. Hand-picked at optimal ripeness and processed using traditional methods.',
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
			images: ['ipfs://QmYwAPJzv5CZsnANHZ8N9aAZZHjz6Q9YQSGkrj6c8qvj8a'],
			certificates: ['ar://kL8K7P9M2N1X5Y6Z3A4B7C8D9E0F1G2H3I4J5K6L7M8N'],
			testReports: ['ipfs://QmNhz8K6P2M9X3Y4Z1A2B5C6D7E8F9G0H1I2J3K4L5M6N']
		}
	};

	let activeTab = $state('overview');
	let showQRCode = $state(false);

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'delivered': return 'text-green-400';
			case 'in transit': return 'text-blue-400';
			case 'quality check': return 'text-yellow-400';
			default: return 'text-gray-400';
		}
	};

	const formatAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};
</script>

<svelte:head>
	<title>Product {productData.id} - ProviChain</title>
</svelte:head>

<PageLayout title="Product Verification" subtitle="Immutable supply chain history and real-time status">
	<!-- Product Header -->
	<section class="mb-8">
		<div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-2xl p-8">
			<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
						<span class="text-sm font-medium text-green-400 uppercase tracking-wide">Verified Authentic</span>
					</div>
					<h1 class="text-3xl font-bold text-white mb-2">{productData.name}</h1>
					<p class="text-gray-300 mb-4">{productData.description}</p>
					
					<div class="grid md:grid-cols-3 gap-4 mb-6">
						<div>
							<p class="text-gray-400 text-sm">Product ID</p>
							<p class="font-mono text-white">{productData.id}</p>
						</div>
						<div>
							<p class="text-gray-400 text-sm">Status</p>
							<p class="font-semibold {getStatusColor(productData.status)}">{productData.status}</p>
						</div>
						<div>
							<p class="text-gray-400 text-sm">Current Location</p>
							<p class="text-white">{productData.currentLocation}</p>
						</div>
					</div>

					<div class="flex flex-wrap gap-2">
						{#each productData.quality.certifications as cert}
							<span class="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
								{cert}
							</span>
						{/each}
					</div>
				</div>

				<div class="text-center">
					<Button 
						onclick={() => showQRCode = !showQRCode} 
						variant="outline" 
						class="mb-4"
					>
						{showQRCode ? 'Hide' : 'Show'} QR Code
					</Button>
					
					{#if showQRCode}
						<div class="bg-white p-4 rounded-lg inline-block">
							<div class="w-32 h-32 bg-black flex items-center justify-center text-white text-xs">
								QR CODE<br/>for<br/>{productData.id}
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
				{#each [
					{ id: 'overview', label: 'Overview' },
					{ id: 'provenance', label: 'Provenance' },
					{ id: 'quality', label: 'Quality' },
					{ id: 'environmental', label: 'Environmental' },
					{ id: 'blockchain', label: 'Blockchain' }
				] as tab}
					<button
						onclick={() => activeTab = tab.id}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
							activeTab === tab.id
								? 'border-green-500 text-green-400'
								: 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
						}"
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		</div>
	</section>

	<!-- Tab Content -->
	{#if activeTab === 'overview'}
		<div class="grid lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<Card title="Product Information" description="Basic details and current status">
					<div class="grid md:grid-cols-2 gap-6">
						<div class="space-y-4">
							<div>
								<p class="text-gray-400 text-sm">Manufacturer</p>
								<p class="text-white font-semibold">{productData.manufacturer}</p>
								<p class="text-gray-400 text-xs font-mono">{formatAddress(productData.manufacturerAddress)}</p>
							</div>
							<div>
								<p class="text-gray-400 text-sm">Total Supply</p>
								<p class="text-white">{productData.totalSupply}</p>
							</div>
							<div>
								<p class="text-gray-400 text-sm">Minted Date</p>
								<p class="text-white">{productData.mintedDate}</p>
							</div>
						</div>
						<div class="space-y-4">
							<div>
								<p class="text-gray-400 text-sm">Current Owner</p>
								<p class="text-white font-mono">{formatAddress(productData.currentOwner)}</p>
							</div>
							<div>
								<p class="text-gray-400 text-sm">NFT Standard</p>
								<p class="text-white">{productData.tokenStandard}</p>
							</div>
							<div>
								<p class="text-gray-400 text-sm">Token ID</p>
								<p class="text-white font-mono">{productData.nftId}</p>
							</div>
						</div>
					</div>
				</Card>

				<Card title="Current Environmental Conditions" description="Live sensor data">
					<div class="grid md:grid-cols-2 gap-6">
						<div class="text-center">
							<div class="text-4xl font-bold text-blue-400 mb-2">
								{productData.environmentalData.currentTemperature}
							</div>
							<p class="text-gray-400">Temperature</p>
						</div>
						<div class="text-center">
							<div class="text-4xl font-bold text-cyan-400 mb-2">
								{productData.environmentalData.currentHumidity}
							</div>
							<p class="text-gray-400">Humidity</p>
						</div>
					</div>
				</Card>
			</div>

			<div class="space-y-6">
				<Card title="Quality Score" description="Overall product quality assessment">
					<div class="text-center mb-6">
						<div class="text-5xl font-bold text-green-400 mb-2">
							{productData.quality.overall}
						</div>
						<p class="text-gray-400">Quality Grade</p>
					</div>
					
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-gray-300">Last Inspection</span>
							<span class="text-white">{productData.quality.lastInspection}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-300">Inspector</span>
							<span class="text-white text-sm">{productData.quality.inspector}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-300">Cup Score</span>
							<span class="text-green-400 font-semibold">{productData.quality.testResults.cupScore}</span>
						</div>
					</div>
				</Card>

				<Card title="Actions" description="Available actions for this product">
					<div class="space-y-3">
						<Button href="/consumer" class="w-full">
							Add to Watchlist
						</Button>
						<Button href="/scan" variant="outline" class="w-full">
							Scan Another Product
						</Button>
						<Button href="/" variant="ghost" class="w-full">
							Back to Home
						</Button>
					</div>
				</Card>
			</div>
		</div>

	{:else if activeTab === 'provenance'}
		<Card title="Complete Supply Chain Journey" description="Immutable history of this product's journey">
			<div class="space-y-6">
				{#each productData.provenance as event, i}
					<div class="flex items-start space-x-4">
						<div class="flex flex-col items-center">
							<div class="w-4 h-4 bg-green-500 rounded-full"></div>
							{#if i < productData.provenance.length - 1}
								<div class="w-px h-16 bg-gray-600 mt-2"></div>
							{/if}
						</div>
						<div class="flex-1 bg-gray-800 rounded-lg p-4">
							<div class="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
								<h3 class="font-semibold text-white">{event.event}</h3>
								<span class="text-gray-400 text-sm">{event.date}</span>
							</div>
							<p class="text-gray-300 mb-2">{event.location}</p>
							<p class="text-gray-400 text-sm mb-3">{event.details}</p>
							
							<div class="grid md:grid-cols-3 gap-4 text-sm">
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
		<div class="grid lg:grid-cols-2 gap-6">
			<Card title="Quality Certifications" description="Official certifications and compliance">
				<div class="space-y-4">
					{#each productData.quality.certifications as cert}
						<div class="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
							<div class="w-3 h-3 bg-green-400 rounded-full"></div>
							<span class="text-white">{cert}</span>
						</div>
					{/each}
				</div>
			</Card>

			<Card title="Test Results" description="Detailed quality assessment">
				<div class="space-y-4">
					<div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
						<span class="text-gray-300">Moisture Content</span>
						<span class="text-blue-400 font-semibold">{productData.quality.testResults.moisture}</span>
					</div>
					<div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
						<span class="text-gray-300">Defect Rate</span>
						<span class="text-green-400 font-semibold">{productData.quality.testResults.defects}</span>
					</div>
					<div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
						<span class="text-gray-300">SCA Cup Score</span>
						<span class="text-green-400 font-semibold">{productData.quality.testResults.cupScore}</span>
					</div>
				</div>
			</Card>
		</div>

	{:else if activeTab === 'environmental'}
		<Card title="Environmental Monitoring" description="Real-time and historical environmental data">
			<div class="grid md:grid-cols-2 gap-6 mb-6">
				<div class="bg-gray-800 rounded-lg p-6 text-center">
					<div class="text-4xl mb-2">🌡️</div>
					<div class="text-3xl font-bold text-blue-400 mb-2">
						{productData.environmentalData.currentTemperature}
					</div>
					<p class="text-gray-400">Current Temperature</p>
				</div>
				<div class="bg-gray-800 rounded-lg p-6 text-center">
					<div class="text-4xl mb-2">💧</div>
					<div class="text-3xl font-bold text-cyan-400 mb-2">
						{productData.environmentalData.currentHumidity}
					</div>
					<p class="text-gray-400">Current Humidity</p>
				</div>
			</div>

			<div class="bg-gray-800 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-white mb-4">Temperature History</h3>
				<div class="space-y-2">
					{#each productData.environmentalData.temperatureHistory as reading}
						<div class="flex justify-between items-center p-2 bg-gray-700 rounded">
							<span class="text-gray-300">{reading.timestamp}</span>
							<span class="text-blue-400 font-semibold">{reading.value}°C</span>
						</div>
					{/each}
				</div>
			</div>
		</Card>

	{:else if activeTab === 'blockchain'}
		<div class="space-y-6">
			<Card title="Smart Contract Events" description="On-chain transaction history">
				<div class="space-y-4">
					{#each productData.smartContractEvents as event}
						<div class="bg-gray-800 rounded-lg p-4">
							<div class="flex justify-between items-start mb-2">
								<span class="font-semibold text-white">{event.event}</span>
								<span class="text-gray-400 text-sm">{event.timestamp}</span>
							</div>
							
							{#if event.from && event.to}
								<div class="text-sm">
									<p class="text-gray-400">From: <span class="text-white font-mono">{formatAddress(event.from)}</span></p>
									<p class="text-gray-400">To: <span class="text-white font-mono">{formatAddress(event.to)}</span></p>
								</div>
							{/if}
							
							{#if event.amount}
								<p class="text-green-400 font-semibold">{event.amount}</p>
							{/if}
							
							{#if event.score}
								<p class="text-blue-400">Quality Score: {event.score}/100</p>
							{/if}
							
							<p class="text-gray-500 text-xs font-mono mt-2">{event.txHash}</p>
						</div>
					{/each}
				</div>
			</Card>

			<Card title="File Attachments" description="IPFS and Arweave storage links">
				<div class="space-y-4">
					<div>
						<h4 class="text-white font-semibold mb-2">Product Images</h4>
						{#each productData.attachments.images as image}
							<a href={image} target="_blank" class="block text-blue-400 hover:text-blue-300 text-sm font-mono">
								{image}
							</a>
						{/each}
					</div>
					<div>
						<h4 class="text-white font-semibold mb-2">Certificates</h4>
						{#each productData.attachments.certificates as cert}
							<a href={cert} target="_blank" class="block text-blue-400 hover:text-blue-300 text-sm font-mono">
								{cert}
							</a>
						{/each}
					</div>
					<div>
						<h4 class="text-white font-semibold mb-2">Test Reports</h4>
						{#each productData.attachments.testReports as report}
							<a href={report} target="_blank" class="block text-blue-400 hover:text-blue-300 text-sm font-mono">
								{report}
							</a>
						{/each}
					</div>
				</div>
			</Card>
		</div>
	{/if}
</PageLayout>
