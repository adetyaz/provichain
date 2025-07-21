<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import { user, isConnected } from '$lib/stores/auth';

	const roles = [
		{
			id: 'manufacturer',
			title: 'Manufacturer',
			description: 'Onboard and tokenize products, manage supply chain automation',
			icon: '🏭',
			features: ['Product Launchpad', 'ASC Builder', 'Quality Monitoring', 'Batch Management']
		},
		{
			id: 'logistics',
			title: 'Logistics Provider',
			description: 'Track shipments, update locations, manage routes',
			icon: '🚚',
			features: ['Real-time Tracking', 'Route Optimization', 'Automated Payments', 'Status Updates']
		},
		{
			id: 'consumer',
			title: 'Consumer',
			description: 'Verify products, view provenance, track purchases',
			icon: '👤',
			features: ['Product Verification', 'Provenance History', 'QR Scanning', 'Purchase Tracking']
		}
	];
</script>

<PageLayout 
	title="Connect Your Wallet" 
	subtitle="Connect to Massa Network and join the ProviChain ecosystem"
	maxWidth="2xl"
>
	{#if $isConnected && $user && $user.role}
		<!-- Already Connected with Role -->
		<div class="text-center">
			<div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-2xl p-8 mb-8">
				<h2 class="text-2xl font-bold text-white mb-4">Welcome to ProviChain!</h2>
				<p class="text-gray-300 mb-6">
					You're connected as a <span class="text-green-400 font-semibold capitalize">{$user.role}</span>
				</p>
				<Button href="/{$user.role}" size="lg">
					Go to Dashboard
				</Button>
			</div>
		</div>
	{:else}
		<!-- Wallet Connection -->
		<div class="max-w-md mx-auto mb-12">
			<WalletConnect />
		</div>
	
		{#if $isConnected && $user && !$user.role}
			<!-- Role Selection (shown by WalletConnect component) -->
			<div class="text-center mb-8">
				<p class="text-gray-400">Please select your role above to continue</p>
			</div>
		{/if}
	{/if}

	<!-- Information Section -->
	<div class="grid md:grid-cols-3 gap-6 mt-12">
		{#each roles as role}
			<Card title={role.title} class="text-center h-full">
				<div class="text-4xl mb-4">{role.icon}</div>
				<h3 class="text-xl font-bold text-white mb-2">{role.title}</h3>
				<p class="text-gray-400 mb-4">{role.description}</p>
				<div class="space-y-2">
					{#each role.features as feature}
						<div class="text-sm text-green-400">✓ {feature}</div>
					{/each}
				</div>
			</Card>
		{/each}
	</div>

	<!-- Requirements -->
	<div class="mt-12 p-6 bg-gray-900/50 rounded-xl border border-gray-700">
		<h3 class="text-lg font-semibold text-white mb-4">Requirements</h3>
		<div class="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
			<div class="flex items-start space-x-2">
				<span class="text-green-400 mt-1">✓</span>
				<span>MassaStation wallet or compatible Massa wallet</span>
			</div>
			<div class="flex items-start space-x-2">
				<span class="text-green-400 mt-1">✓</span>
				<span>Small amount of MAS tokens for transactions</span>
			</div>
			<div class="flex items-start space-x-2">
				<span class="text-green-400 mt-1">✓</span>
				<span>Web browser with wallet extension enabled</span>
			</div>
			<div class="flex items-start space-x-2">
				<span class="text-green-400 mt-1">✓</span>
				<span>Connection to Massa Network (mainnet/buildnet)</span>
			</div>
		</div>
	</div>

	<!-- Help Section -->
	<div class="mt-8 text-center">
		<h3 class="text-lg font-semibold text-white mb-4">Need Help?</h3>
		<div class="flex flex-wrap justify-center gap-4">
			<Button href="https://station.massa.net/" variant="outline">
				Download MassaStation
			</Button>
			<Button href="https://docs.massa.net/" variant="outline">
				Massa Documentation
			</Button>
			<Button href="/about" variant="ghost">
				Learn About ProviChain
			</Button>
		</div>
	</div>
</PageLayout>
