<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import { user, isConnected } from '$lib/stores/auth';

	const features = [
		{
			title: 'Autonomous Smart Contracts',
			description: 'Self-executing supply chain automation without external dependencies',
			icon: '🤖'
		},
		{
			title: 'Product Passports',
			description: 'Immutable digital twins tracking every product\'s journey',
			icon: '📋'
		},
		{
			title: 'Real-Time IoT Integration',
			description: 'Live sensor data from temperature, GPS, and quality monitors',
			icon: '📡'
		},
		{
			title: 'Decentralized Hosting',
			description: 'Censorship-resistant frontend on Massa\'s DeWeb network',
			icon: '🌐'
		}
	];

	const stats = [
		{ label: 'Products Tracked', value: '12,847', change: '+23%' },
		{ label: 'Supply Chains', value: '156', change: '+12%' },
		{ label: 'Automated Payments', value: '$2.4M', change: '+45%' },
		{ label: 'Quality Alerts', value: '1,234', change: '-8%' }
	];
</script>

<div class="bg-black min-h-screen">
	<!-- Hero Section -->
	<section class="relative px-4 sm:px-6 lg:px-8 py-20">
		<div class="max-w-7xl mx-auto text-center">
			<div class="mb-8">
				<h1 class="text-5xl md:text-7xl font-bold mb-6">
					<span class="bg-gradient-to-r from-green-400 via-emerald-500 to-cyan-400 bg-clip-text text-transparent">
						Autonomous
					</span>
					<br />
					<span class="text-white">Supply Chains</span>
				</h1>
				<p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
					Revolutionizing global supply chains with trustless, transparent, and highly automated 
					<span class="text-green-400 font-semibold">Real-World Asset tokenization</span> 
					powered by Massa Network
				</p>
			</div>

			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
				{#if $isConnected && $user}
					<Button href="/{$user.role}" size="lg">
						Go to {$user.role === 'manufacturer' ? 'Manufacturer' : $user.role === 'logistics' ? 'Logistics' : 'Consumer'} Dashboard
					</Button>
				{:else}
					<Button href="/connect" size="lg">
						Start Tracking Products
					</Button>
				{/if}
				<Button href="/scan" variant="outline" size="lg">
					Verify Product
				</Button>
				<Button href="/about" variant="ghost" size="lg">
					Learn More
				</Button>
			</div>

			<!-- Stats -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
				{#each stats as stat}
					<div class="text-center">
						<div class="text-3xl md:text-4xl font-bold text-white mb-2">
							{stat.value}
						</div>
						<div class="text-gray-400 text-sm mb-1">{stat.label}</div>
						<div class="text-xs {stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}">
							{stat.change} this month
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-black to-gray-900">
		<div class="max-w-7xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
					Powered by <span class="text-green-400">Massa Network</span>
				</h2>
				<p class="text-xl text-gray-300 max-w-3xl mx-auto">
					Leveraging unique blockchain capabilities for truly autonomous supply chain management
				</p>
			</div>

			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
				{#each features as feature}
					<Card title={feature.title} description={feature.description}>
						<div class="text-4xl mb-4">{feature.icon}</div>
						<Button variant="ghost" size="sm" href="/about">
							Learn More
						</Button>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Use Cases Section -->
	<section class="px-4 sm:px-6 lg:px-8 py-20 bg-black">
		<div class="max-w-7xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
					Built for Every Stakeholder
				</h2>
				<p class="text-xl text-gray-300">
					From manufacturer to consumer, everyone benefits from transparent supply chains
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8">
				<Card title="Manufacturers" description="Onboard products and build trust">
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-green-400 rounded-full"></div>
							<span class="text-gray-300">Product Launchpad</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-green-400 rounded-full"></div>
							<span class="text-gray-300">ASC Automation</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-green-400 rounded-full"></div>
							<span class="text-gray-300">Quality Monitoring</span>
						</div>
						<Button href="/manufacturer" variant="outline" size="sm" class="w-full mt-4">
							Manufacturer Portal
						</Button>
					</div>
				</Card>

				<Card title="Logistics Providers" description="Track shipments and automate payments">
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
							<span class="text-gray-300">Real-time Tracking</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
							<span class="text-gray-300">Automated Payments</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
							<span class="text-gray-300">Route Optimization</span>
						</div>
						<Button href="/logistics" variant="outline" size="sm" class="w-full mt-4">
							Logistics Portal
						</Button>
					</div>
				</Card>

				<Card title="Consumers" description="Verify authenticity and track provenance">
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
							<span class="text-gray-300">Product Verification</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
							<span class="text-gray-300">Provenance History</span>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
							<span class="text-gray-300">Quality Assurance</span>
						</div>
						<Button href="/scan" variant="outline" size="sm" class="w-full mt-4">
							Verify Product
						</Button>
					</div>
				</Card>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-green-900/20 to-emerald-900/20">
		<div class="max-w-4xl mx-auto text-center">
			<h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
				Ready to Transform Your Supply Chain?
			</h2>
			<p class="text-xl text-gray-300 mb-8">
				Join the future of autonomous, transparent, and trustless supply chain management
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button href="/connect" size="lg">
					Get Started Today
				</Button>
				<Button href="/about" variant="outline" size="lg">
					Learn More
				</Button>
			</div>
		</div>
	</section>
</div>
