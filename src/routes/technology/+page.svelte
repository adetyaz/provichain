<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	const platformFeatures = [
		{
			title: 'Autonomous Smart Contracts (ASCs)',
			description: 'Self-executing contracts that automatically handle quality checks, payments, and compliance without external dependencies.',
			icon: '⚡',
			benefits: [
				'Automatic quality verification',
				'Instant payment releases',
				'Zero-downtime operations',
				'Tamper-proof execution'
			]
		},
		{
			title: 'Real-World Asset Tokenization',
			description: 'Transform physical products into digital NFTs with immutable provenance and ownership tracking.',
			icon: '🏷️',
			benefits: [
				'Immutable product history',
				'Digital ownership certificates',
				'Fractional ownership support',
				'Resale marketplace integration'
			]
		},
		{
			title: 'IoT Integration & Monitoring',
			description: 'Real-time sensor data collection for temperature, humidity, location, and quality parameters.',
			icon: '📡',
			benefits: [
				'Real-time environmental monitoring',
				'Automated quality alerts',
				'GPS tracking integration',
				'Predictive maintenance'
			]
		},
		{
			title: 'Cross-Chain Interoperability',
			description: 'Seamless integration with multiple blockchain networks for maximum flexibility and reach.',
			icon: '🔗',
			benefits: [
				'Multi-chain asset support',
				'Universal wallet compatibility',
				'Cross-chain value transfers',
				'Network-agnostic operations'
			]
		}
	];

	const useCases = [
		{
			industry: 'Food & Beverage',
			description: 'Track organic certification, temperature control, and supply chain authenticity from farm to table.',
			examples: ['Organic Coffee', 'Premium Wine', 'Artisan Cheese', 'Fresh Produce'],
			icon: '🍽️'
		},
		{
			industry: 'Luxury Goods',
			description: 'Verify authenticity and prevent counterfeiting of high-value items with digital certificates.',
			examples: ['Swiss Watches', 'Designer Handbags', 'Fine Jewelry', 'Art Pieces'],
			icon: '💎'
		},
		{
			industry: 'Pharmaceuticals',
			description: 'Ensure drug authenticity, cold chain compliance, and regulatory adherence throughout distribution.',
			examples: ['Prescription Drugs', 'Vaccines', 'Medical Devices', 'Supplements'],
			icon: '💊'
		},
		{
			industry: 'Electronics',
			description: 'Combat counterfeiting and provide warranty tracking for electronic components and devices.',
			examples: ['Smartphones', 'Computer Parts', 'Audio Equipment', 'Smart Devices'],
			icon: '📱'
		}
	];

	const technicalSpecs = [
		{
			component: 'Blockchain Infrastructure',
			technology: 'Massa Protocol',
			details: 'High-throughput blockchain with autonomous smart contracts and DeWeb hosting'
		},
		{
			component: 'Smart Contract Framework',
			technology: 'Autonomous Smart Contracts (ASCs)',
			details: 'Self-executing contracts with built-in quality checking and payment automation'
		},
		{
			component: 'Storage Layer',
			technology: 'IPFS + Arweave',
			details: 'Decentralized storage for product data, images, and documentation'
		},
		{
			component: 'Cross-Chain Protocol',
			technology: 'Chainlink CCIP + Wormhole',
			details: 'Secure cross-chain communication and asset bridging'
		},
		{
			component: 'IoT Integration',
			technology: 'Multi-Protocol Sensors',
			details: 'Temperature, GPS, humidity, and custom sensor integration'
		},
		{
			component: 'Frontend Framework',
			technology: 'Svelte 5 + TailwindCSS',
			details: 'Modern reactive UI with responsive design and Web3 wallet integration'
		}
	];

	const stats = [
		{ label: 'Products Tracked', value: '10,000+', icon: '📦' },
		{ label: 'Supply Chain Partners', value: '500+', icon: '🏢' },
		{ label: 'Countries Served', value: '25', icon: '🌍' },
		{ label: 'Authenticity Rate', value: '99.9%', icon: '✅' }
	];
</script>

<PageLayout 
	title="Technology Overview" 
	subtitle="Learn about the cutting-edge technology powering ProviChain's transparent supply chain"
>
	<!-- Stats Section -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
		{#each stats as stat}
			<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 text-center">
				<div class="text-3xl mb-2">{stat.icon}</div>
				<div class="text-2xl font-bold text-white mb-1">{stat.value}</div>
				<div class="text-gray-400 text-sm">{stat.label}</div>
			</div>
		{/each}
	</section>

	<!-- Core Features -->
	<section class="mb-12">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold text-white mb-4">Core Technology Features</h2>
			<p class="text-gray-300 max-w-3xl mx-auto">
				ProviChain leverages cutting-edge blockchain technology, IoT integration, and autonomous smart contracts 
				to provide unprecedented transparency and automation in supply chain management.
			</p>
		</div>

		<div class="grid md:grid-cols-2 gap-8">
			{#each platformFeatures as feature}
				<Card title={feature.title} description={feature.description}>
					<div class="flex items-start space-x-4 mb-4">
						<div class="text-4xl">{feature.icon}</div>
						<div class="flex-1">
							<h4 class="font-semibold text-white mb-2">Key Benefits</h4>
							<ul class="space-y-1">
								{#each feature.benefits as benefit}
									<li class="text-gray-300 text-sm flex items-center">
										<span class="text-green-400 mr-2">✓</span>
										{benefit}
									</li>
								{/each}
							</ul>
						</div>
					</div>
					<Button href="/docs/technology/{feature.title.toLowerCase().replace(/\s+/g, '-')}" variant="outline" size="sm">
						Learn More
					</Button>
				</Card>
			{/each}
		</div>
	</section>

	<!-- Use Cases -->
	<section class="mb-12">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold text-white mb-4">Industry Applications</h2>
			<p class="text-gray-300 max-w-2xl mx-auto">
				ProviChain's technology adapts to various industries, providing tailored solutions 
				for different supply chain challenges and requirements.
			</p>
		</div>

		<div class="grid md:grid-cols-2 gap-8">
			{#each useCases as useCase}
				<Card title={useCase.industry}>
					<div class="flex items-start space-x-4">
						<div class="text-4xl">{useCase.icon}</div>
						<div class="flex-1">
							<h3 class="text-xl font-semibold text-white mb-2">{useCase.industry}</h3>
							<p class="text-gray-300 text-sm mb-4">{useCase.description}</p>
							<div class="mb-4">
								<h4 class="text-gray-400 text-xs font-semibold mb-2">EXAMPLE PRODUCTS</h4>
								<div class="flex flex-wrap gap-2">
									{#each useCase.examples as example}
										<span class="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
											{example}
										</span>
									{/each}
								</div>
							</div>
							<Button href="/marketplace/category/{useCase.industry.toLowerCase().replace(/\s+/g, '-')}" variant="outline" size="sm">
								Explore Products
							</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	</section>

	<!-- Technical Architecture -->
	<section class="mb-12">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold text-white mb-4">Technical Architecture</h2>
			<p class="text-gray-300 max-w-2xl mx-auto">
				Built on modern, scalable technologies that ensure security, performance, and reliability 
				for global supply chain operations.
			</p>
		</div>

		<Card title="System Components" description="Core technologies powering the ProviChain ecosystem">
			<div class="space-y-4">
				{#each technicalSpecs as spec}
					<div class="bg-gray-800 rounded-lg p-4">
						<div class="flex items-start justify-between mb-2">
							<h4 class="font-semibold text-white">{spec.component}</h4>
							<span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
								{spec.technology}
							</span>
						</div>
						<p class="text-gray-300 text-sm">{spec.details}</p>
					</div>
				{/each}
			</div>
		</Card>
	</section>

	<!-- Architecture Diagram -->
	<section class="mb-12">
		<Card title="System Architecture" description="High-level overview of ProviChain's technology stack">
			<div class="bg-gray-900 rounded-lg p-8 text-center">
				<div class="text-8xl mb-4">🏗️</div>
				<p class="text-gray-400 mb-4">Interactive architecture diagram coming soon</p>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
					<div class="bg-gray-800 rounded-lg p-4">
						<h4 class="font-semibold text-white mb-2">Presentation Layer</h4>
						<p class="text-gray-300">Svelte 5 + TailwindCSS</p>
						<p class="text-gray-300">Web3 Wallet Integration</p>
					</div>
					<div class="bg-gray-800 rounded-lg p-4">
						<h4 class="font-semibold text-white mb-2">Business Logic</h4>
						<p class="text-gray-300">Autonomous Smart Contracts</p>
						<p class="text-gray-300">IoT Data Processing</p>
					</div>
					<div class="bg-gray-800 rounded-lg p-4">
						<h4 class="font-semibold text-white mb-2">Data Layer</h4>
						<p class="text-gray-300">Massa Blockchain</p>
						<p class="text-gray-300">IPFS/Arweave Storage</p>
					</div>
				</div>
			</div>
		</Card>
	</section>

	<!-- Call to Action -->
	<section class="text-center bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-8">
		<h2 class="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
		<p class="text-gray-300 mb-6 max-w-2xl mx-auto">
			Join the future of transparent supply chains. Whether you're a manufacturer, logistics provider, 
			or consumer, ProviChain has the tools you need.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button href="/connect" size="lg" class="px-8">
				Connect Wallet
			</Button>
			<Button href="/docs" variant="outline" size="lg" class="px-8">
				View Documentation
			</Button>
		</div>
	</section>
</PageLayout>
