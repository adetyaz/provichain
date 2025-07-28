<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { checkUserRole, requestRole, getUserAddress } from '$lib/web3';
	import { user, connectWallet, isConnected, isManuallyDisconnected, type User } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// State management - Svelte 5 syntax
	let loading = $state(true);
	let requestingRole = $state<string | null>(null); // Track which specific role is being requested
	let error = $state('');
	let success = $state('');

	// Use auth store for user data
	let userAddress = $derived($user?.address || '');
	let userRole = $derived($user?.role || '');

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
			
			// Don't auto-connect on the connect page - let user manually choose
			console.log('🌐 Connect page loaded - ready for user to connect wallet');
			
			// If already connected, check their role status
			if ($isConnected && $user) {
				console.log('✅ Wallet already connected, checking role status');
				
				// If user doesn't have a role, assign consumer as default
				if (!$user.role || $user.role === null) {
					console.log('👤 No role found, assigning default consumer role');
					user.update(u => u ? { ...u, role: 'consumer' } : u);
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
			requestingRole = roleId; // Set the specific role being requested
			error = '';
			success = '';

			const result = await requestRole(roleId, `Requesting ${roleId} role for ProviChain access`);
			
			if (result.success) {
				success = `Role request submitted! Operation ID: ${result.operationId}`;
				
				// Update the user role locally immediately to provide better UX
				// The blockchain verification will happen in the background
				if (roleId === 'CONSUMER' || userRole === null) {
					// For consumer role or first role, update immediately
					user.update(u => u ? { ...u, role: roleId.toLowerCase() as User['role'] } : u);
				}
				
				// Refresh role check after a moment by reconnecting (but preserve current address)
				setTimeout(async () => {
					// Check roles from blockchain to confirm
					const { updateUserRoleFromBlockchain } = await import('$lib/stores/auth');
					await updateUserRoleFromBlockchain(false);
					
					// Navigate to appropriate dashboard
					const route = roleId === 'MANUFACTURER' ? '/manufacturer' : 
								 roleId === 'LOGISTICS' ? '/logistics' : '/consumer';
					goto(route);
				}, 3000);
			} else {
				error = result.error || 'Failed to request role';
			}
		} catch (err) {
			error = 'Error requesting role: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			requestingRole = null; // Clear the requesting state
		}
	}	// Navigate to dashboard based on role
	function navigateToDashboard() {
		if (userRole === 'manufacturer') goto('/manufacturer');
		else if (userRole === 'logistics') goto('/logistics');
		else if (userRole === 'consumer') goto('/consumer');
		else if (userRole === 'admin') goto('/admin');
		else {
			console.warn('Unknown role:', userRole);
			goto('/');
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
	<div class="max-w-6xl mx-auto px-4 py-8">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
			<p class="text-gray-400 text-lg">Connect to Massa Network and join the ProviChain ecosystem</p>
		</div>

		{#if loading}
			<div class="text-center py-8">
				<div class="text-blue-400">Checking wallet connection...</div>
			</div>
		{:else if userAddress}
			<!-- Wallet Connected - Always show role selection -->
			{#if userRole}
				<!-- Current Role Status -->
				<div class="text-center mb-6">
					<div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-4 mb-6">
						<h2 class="text-lg font-bold text-white mb-2">Currently Connected</h2>
						<p class="text-gray-300 mb-2">
							Address: <code class="text-green-400 font-mono text-sm">{userAddress.slice(0, 12)}...{userAddress.slice(-8)}</code>
						</p>
						<p class="text-gray-300 mb-3">
							Active Role: <span class="text-green-400 font-semibold capitalize">{userRole}</span>
						</p>
						<div class="flex gap-3 justify-center">
							<Button onclick={navigateToDashboard} size="sm">
								Go to Dashboard
							</Button>
							<Button href="/settings" variant="outline" size="sm">
								Account Settings
							</Button>
						</div>
					</div>
					<div class="bg-blue-900/20 rounded-lg p-4 mb-6">
						<p class="text-gray-400 text-sm">Want to request additional roles or upgrade? Select a role below:</p>
					</div>
				</div>
			{:else}
				<!-- No Role Yet -->
				<div class="text-center mb-6">
					<div class="bg-blue-900/20 rounded-lg p-4 mb-6">
						<h2 class="text-lg font-bold text-white mb-2">Wallet Connected!</h2>
						<p class="text-gray-300 mb-2">
							Address: <code class="text-blue-400 font-mono text-sm">{userAddress.slice(0, 12)}...{userAddress.slice(-8)}</code>
						</p>
						<p class="text-gray-400 text-sm">Please select your role to continue:</p>
					</div>
				</div>
			{/if}
			
		
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

			<!-- Role Selection - Always Available When Wallet Connected -->
			<div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
				{#each roles as role}
					{@const hasThisRole = userRole === role.id.toLowerCase()}
					<div class="bg-gray-800 border {hasThisRole ? 'border-green-500/50 bg-green-900/10' : 'border-gray-700'} hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 rounded-xl p-8 h-full flex flex-col min-h-[500px]">
						<div class="text-center mb-6 flex-grow">
							<div class="text-5xl mb-4">{role.icon}</div>
							<div class="flex items-center justify-center gap-2 mb-3">
								<h3 class="text-lg font-bold text-white">{role.title}</h3>
								{#if hasThisRole}
									<span class="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">Active</span>
								{/if}
							</div>
							<p class="text-gray-400 mb-4 text-sm leading-relaxed">{role.description}</p>
						</div>
						<div class="space-y-3 mb-6">
							<h4 class="text-sm font-semibold text-green-400 uppercase tracking-wide">Key Features</h4>
							{#each role.features as feature}
								<div class="flex items-center gap-3">
									<div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
									<span class="text-gray-300 text-sm">{feature}</span>
								</div>
							{/each}
						</div>
						<Button 
							onclick={() => handleRoleRequest(role.id)}
							class="w-full mt-auto py-3 text-base"
							size="md"
						>
							{requestingRole === role.id ? 'Requesting...' : 
							 userRole === role.id.toLowerCase() ? `Current ${role.title} Role` :
							 userRole ? `Request ${role.title} Role` : 
							 `Request ${role.title} Role`}
						</Button>
					</div>
				{/each}
			</div>
	{:else}
		<!-- No Wallet Connected -->
		<div class="text-center">
			<div class="bg-gray-900/50 rounded-xl p-6 mb-6 max-w-lg mx-auto">
				<h2 class="text-xl font-bold text-white mb-3">Connect Your Wallet</h2>
				<p class="text-gray-400 mb-4 text-sm">
					Connect your Massa wallet to access ProviChain features
				</p>
				<Button onclick={connectWallet} size="md" class="mb-3">
					Connect Wallet
				</Button>
				<div class="text-gray-500 text-xs">
					Please install and connect a Massa-compatible wallet to continue
				</div>
			</div>

			<!-- Role Information for Non-Connected Users -->
			<div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
				{#each roles as role}
					<div class="text-center h-full bg-gray-800/50 border border-gray-600 rounded-xl p-6">
						<div class="text-4xl mb-4">{role.icon}</div>
						<h3 class="text-lg font-bold text-white mb-2">{role.title}</h3>
						<p class="text-gray-400 mb-4 text-sm">{role.description}</p>
						<div class="space-y-2">
							<h4 class="text-xs font-semibold text-green-400 uppercase tracking-wide">What You Can Do</h4>
							{#each role.features as feature}
								<div class="flex items-center gap-2 justify-center">
									<span class="text-green-400 text-xs">✓</span>
									<span class="text-xs text-gray-300">{feature}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

		<!-- Requirements -->
		<div class="mt-16 p-8 bg-gray-900/50 rounded-xl border border-gray-700">
			<h3 class="text-xl font-semibold text-white mb-6 text-center">System Requirements</h3>
			<div class="grid md:grid-cols-2 gap-6 text-gray-300">
				<div class="flex items-start space-x-3">
					<span class="text-green-400 mt-1 text-lg">✓</span>
					<div>
						<div class="font-medium text-white">Massa Wallet</div>
						<div class="text-sm text-gray-400">MassaStation or compatible wallet extension</div>
					</div>
				</div>
				<div class="flex items-start space-x-3">
					<span class="text-green-400 mt-1 text-lg">✓</span>
					<div>
						<div class="font-medium text-white">MAS Tokens</div>
						<div class="text-sm text-gray-400">Small amount needed for blockchain transactions</div>
					</div>
				</div>
				<div class="flex items-start space-x-3">
					<span class="text-green-400 mt-1 text-lg">✓</span>
					<div>
						<div class="font-medium text-white">Web Browser</div>
						<div class="text-sm text-gray-400">Modern browser with wallet extension support</div>
					</div>
				</div>
				<div class="flex items-start space-x-3">
					<span class="text-green-400 mt-1 text-lg">✓</span>
					<div>
						<div class="font-medium text-white">Network Connection</div>
						<div class="text-sm text-gray-400">Active connection to Massa blockchain network</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Help Section -->
		<div class="mt-8 text-center">
			<div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/20">
				<h3 class="text-lg font-semibold text-white mb-3">Need Help Getting Started?</h3>
				<p class="text-gray-400 mb-4 max-w-2xl mx-auto text-sm">
					New to Massa blockchain or need assistance setting up your wallet? We've got you covered with these helpful resources.
				</p>
				<div class="flex flex-wrap justify-center gap-3">
					<Button href="https://station.massa.net/" variant="outline" size="sm" class="flex items-center gap-2">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
						Download MassaStation
					</Button>
					<Button href="https://docs.massa.net/" variant="outline" size="sm" class="flex items-center gap-2">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
						</svg>
						Massa Documentation
					</Button>
					<Button href="/about" variant="ghost" size="sm" class="flex items-center gap-2">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
						</svg>
						Learn About ProviChain
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
