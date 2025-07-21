<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';

	const technologies = [
		{
			name: 'Massa Blockchain',
			description: 'High-performance blockchain with autonomous smart contracts',
			icon: '⛓️'
		},
		{
			name: 'Autonomous Smart Contracts',
			description: 'Self-executing contracts without external dependencies',
			icon: '🤖'
		},
		{
			name: 'DeWeb Hosting',
			description: 'Censorship-resistant frontend on .massa domains',
			icon: '🌐'
		},
		{
			name: 'IoT Integration',
			description: 'Real-time sensor data from temperature, GPS, and quality monitors',
			icon: '📡'
		}
	];

	const benefits = [
		{
			title: 'Transparency',
			description: 'Complete visibility into every step of the supply chain',
			icon: '👁️'
		},
		{
			title: 'Automation',
			description: 'Autonomous payments and quality controls reduce manual intervention',
			icon: '⚡'
		},
		{
			title: 'Trust',
			description: 'Immutable records prevent counterfeiting and fraud',
			icon: '🔒'
		},
		{
			title: 'Efficiency',
			description: 'Streamlined processes and reduced costs through smart contracts',
			icon: '🚀'
		}
	];

	const useCases = [
		{
			title: 'Luxury Goods',
			description: 'Track high-value items from production to consumer',
			example: 'Watches, jewelry, designer items'
		},
		{
			title: 'Food & Pharmaceuticals',
			description: 'Monitor temperature and quality during transport',
			example: 'Vaccines, fresh produce, medical supplies'
		},
		{
			title: 'Electronics',
			description: 'Verify authenticity and prevent counterfeiting',
			example: 'Semiconductors, smartphones, components'
		},
		{
			title: 'Automotive',
			description: 'Track parts and components throughout assembly',
			example: 'Parts, batteries, complete vehicles'
		}
	];
</script>

<PageLayout 
	title="About ProviChain" 
	subtitle="Revolutionizing supply chains with autonomous blockchain technology"
>
	<!-- Mission Section -->
	<section class="mb-16">
		<div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-2xl p-8 mb-12">
			<h2 class="text-2xl font-bold text-white mb-4">Our Mission</h2>
			<p class="text-lg text-gray-300 leading-relaxed">
				To revolutionize global supply chains by providing a trustless, transparent, and highly automated platform 
				for tokenizing physical goods as Real-World Assets (RWAs) on the Massa Network. ProviChain leverages 
				Autonomous Smart Contracts (ASCs) for self-executing logistics, On-Chain Web Hosting for censorship-resistant 
				access, and a dedicated "Product Launchpad" to streamline the onboarding of assets into the decentralized 
				supply chain ecosystem.
			</p>
		</div>
	</section>

	<!-- Technologies Section -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold text-white mb-8">Powered by Cutting-Edge Technology</h2>
		<div class="grid md:grid-cols-2 gap-6">
			{#each technologies as tech}
				<Card title={tech.name} description={tech.description}>
					<div class="text-4xl mb-4">{tech.icon}</div>
				</Card>
			{/each}
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold text-white mb-8">Why Choose ProviChain?</h2>
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each benefits as benefit}
				<Card title={benefit.title} description={benefit.description}>
					<div class="text-3xl mb-4">{benefit.icon}</div>
				</Card>
			{/each}
		</div>
	</section>

	<!-- Use Cases Section -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold text-white mb-8">Industry Applications</h2>
		<div class="grid md:grid-cols-2 gap-6">
			{#each useCases as useCase}
				<Card title={useCase.title} description={useCase.description}>
					<div class="mt-4 p-3 bg-gray-800 rounded-lg">
						<p class="text-sm text-gray-300">
							<span class="font-semibold text-green-400">Examples:</span> {useCase.example}
						</p>
					</div>
				</Card>
			{/each}
		</div>
	</section>

	<!-- How It Works Section -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold text-white mb-8">How It Works</h2>
		<div class="space-y-6">
			<div class="flex items-start space-x-4">
				<div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold">1</div>
				<div>
					<h3 class="text-lg font-semibold text-white">Product Onboarding</h3>
					<p class="text-gray-300">Manufacturers use our Product Launchpad to tokenize their products as NFTs on the Massa blockchain</p>
				</div>
			</div>
			<div class="flex items-start space-x-4">
				<div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold">2</div>
				<div>
					<h3 class="text-lg font-semibold text-white">Supply Chain Tracking</h3>
					<p class="text-gray-300">IoT sensors and manual checkpoints update product status in real-time throughout the supply chain</p>
				</div>
			</div>
			<div class="flex items-start space-x-4">
				<div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold">3</div>
				<div>
					<h3 class="text-lg font-semibold text-white">Autonomous Execution</h3>
					<p class="text-gray-300">Smart contracts automatically execute payments, quality checks, and other conditions without human intervention</p>
				</div>
			</div>
			<div class="flex items-start space-x-4">
				<div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold">4</div>
				<div>
					<h3 class="text-lg font-semibold text-white">Consumer Verification</h3>
					<p class="text-gray-300">End consumers can verify product authenticity and view complete provenance history</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="text-center bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8">
		<h2 class="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
		<p class="text-gray-300 mb-6">Join the future of supply chain management today</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button href="/connect" size="lg">Connect Wallet</Button>
			<Button href="/scan" variant="outline" size="lg">Verify Product</Button>
		</div>
	</section>
</PageLayout>
