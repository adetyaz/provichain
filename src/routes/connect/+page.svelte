<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { checkUserRole, requestRole, getUserAddress } from '$lib/web3';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// State management - Svelte 5 syntax
	let userAddress = $state('');
	let userRole = $state('');
	let loading = $state(true);
	let requestingRole = $state(false);
	let error = $state('');
	let success = $state('');

	const roles = [
		{
			id: 'MANUFACTURER',
			title: 'Manufacturer',
			description: 'Onboard and tokenize products, manage supply chain automation',
			icon: '🏭',
			features: ['Product Minting', 'ASC Configuration', 'Quality Monitoring', 'Batch Management']
		},
		{
			id: 'LOGISTICS',
			title: 'Logistics Provider', 
			description: 'Track shipments, update locations, manage routes',
			icon: '🚚',
			features: ['Real-time Tracking', 'Route Optimization', 'Automated Payments', 'Status Updates']
		},
		{
			id: 'CONSUMER',
			title: 'Consumer',
			description: 'Verify products, view provenance, track purchases',
			icon: '👤',
			features: ['Product Verification', 'Provenance History', 'QR Scanning', 'Purchase Tracking']
		}
	];
	// Check wallet connection and role on mount
	onMount(async () => {
		try {
			loading = true;
			userAddress = await getUserAddress();
			
			if (userAddress) {
				// Check for existing roles
				for (const role of roles) {
					const hasRole = await checkUserRole(role.id);
					if (hasRole) {
						userRole = role.id;
						break;
					}
				}
			}
		} catch (err) {
			console.error('Error checking wallet connection:', err);
		} finally {
			loading = false;
		}
	});

	// Request role assignment
	async function handleRoleRequest(roleId: string) {
		if (!userAddress) {
			error = 'Please connect your wallet first';
			return;
		}

		try {
			requestingRole = true;
			error = '';
			success = '';

			const result = await requestRole(roleId, `Requesting ${roleId} role for ProviChain access`);
			
			if (result.success) {
				success = `Role request submitted! Operation ID: ${result.operationId}`;
				// Refresh role check after a moment
				setTimeout(async () => {
					const hasRole = await checkUserRole(roleId);
					if (hasRole) {
						userRole = roleId;
						const route = roleId === 'MANUFACTURER' ? '/manufacturer' : 
									 roleId === 'LOGISTICS' ? '/logistics' : '/consumer';
						goto(route);
					}
				}, 3000);
			} else {
				error = result.error || 'Failed to request role';
			}
		} catch (err) {
			error = 'Error requesting role: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			requestingRole = false;
		}
	}

	// Navigate to dashboard based on role
	function navigateToDashboard() {
		if (userRole === 'MANUFACTURER') goto('/manufacturer');
		else if (userRole === 'LOGISTICS') goto('/logistics');
		else if (userRole === 'CONSUMER') goto('/consumer');
	}
</script>

<PageLayout 
	title="Connect Your Wallet" 
	subtitle="Connect to Massa Network and join the ProviChain ecosystem"
	maxWidth="2xl"
>
	{#if loading}
		<div class="text-center py-8">
			<div class="text-blue-400">Checking wallet connection...</div>
		</div>
	{:else if userAddress && userRole}
		<!-- Already Connected with Role -->
		<div class="text-center">
			<div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-2xl p-8 mb-8">
				<h2 class="text-2xl font-bold text-white mb-4">Welcome to ProviChain!</h2>
				<p class="text-gray-300 mb-2">
					Address: <code class="text-green-400 font-mono">{userAddress.slice(0, 12)}...{userAddress.slice(-8)}</code>
				</p>
				<p class="text-gray-300 mb-6">
					You're connected as a <span class="text-green-400 font-semibold">{userRole}</span>
				</p>
				<Button onclick={navigateToDashboard} size="lg">
					Go to Dashboard
				</Button>
			</div>
		</div>
	{:else if userAddress && !userRole}
		<!-- Wallet Connected, Need Role -->
		<div class="text-center mb-8">
			<div class="bg-blue-900/20 rounded-lg p-6 mb-8">
				<h2 class="text-xl font-bold text-white mb-2">Wallet Connected!</h2>
				<p class="text-gray-300 mb-2">
					Address: <code class="text-blue-400 font-mono">{userAddress.slice(0, 12)}...{userAddress.slice(-8)}</code>
				</p>
				<p class="text-gray-400">Please select your role to continue:</p>
			</div>
		</div>

		{#if success}
			<div class="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6 max-w-lg mx-auto">
				<div class="text-green-400">{success}</div>
			</div>
		{/if}

		{#if error}
			<div class="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6 max-w-lg mx-auto">
				<div class="text-red-400">{error}</div>
			</div>
		{/if}

		<!-- Role Selection -->
		<div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
			{#each roles as role}
				<Card title={role.title} description={role.description} class="bg-gray-800 border-gray-700 hover:border-green-500/30 transition-all">
					<div class="text-center mb-4">
						<div class="text-4xl mb-3">{role.icon}</div>
					</div>
					<div class="space-y-3 mb-6">
						{#each role.features as feature}
							<div class="flex items-center gap-2">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span class="text-gray-300 text-sm">{feature}</span>
							</div>
						{/each}
					</div>
					<Button 
						onclick={() => handleRoleRequest(role.id)}
						disabled={requestingRole}
						class="w-full"
					>
						{requestingRole ? 'Requesting...' : `Request ${role.title} Role`}
					</Button>
				</Card>
			{/each}
		</div>
	{:else}
		<!-- No Wallet Connected -->
		<div class="text-center">
			<div class="bg-gray-900/50 rounded-2xl p-8 mb-8 max-w-lg mx-auto">
				<h2 class="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
				<p class="text-gray-400 mb-6">
					Connect your Massa wallet to access ProviChain features
				</p>
				<div class="text-gray-500 text-sm">
					Please install and connect a Massa-compatible wallet to continue
				</div>
			</div>
		</div>
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
