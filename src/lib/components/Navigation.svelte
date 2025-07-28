<script lang="ts">
	import { onMount } from 'svelte';
	import { user, connectWallet, disconnectWallet, isConnected, isLoading, switchWallet, forceDisconnectWallet, getWalletAccounts } from '$lib/stores/auth';
	import { getVisibleNavItems } from '$lib/stores/navigation';
	import { page } from '$app/state';

	let showMobileMenu = $state(false);
	let showAccountSelector = $state(false);
	let availableAccounts = $state<any[]>([]);
	let userRole = $derived($user?.role);
	let visibleNavItems = $derived(getVisibleNavItems(userRole ?? null));

	const handleConnect = async () => {
		if ($isConnected) {
			// Show account selector to allow switching between accounts
			const accountsResult = await getWalletAccounts();
			if (accountsResult.success && accountsResult.data) {
				availableAccounts = accountsResult.data;
				showAccountSelector = true;
			} else {
				console.error('Failed to get accounts for switching');
			}
		} else {
			// Connect to wallet (default to account 0)
			await connectWallet();
		}
	};

	const handleAccountSelect = async (accountIndex: number) => {
		try {
			showAccountSelector = false;
			console.log(`🔄 Switching to account ${accountIndex}...`);
			await connectWallet(accountIndex);
			console.log(`✅ Successfully switched to account ${accountIndex}`);
		} catch (error) {
			console.error('❌ Failed to switch account:', error);
		}
	};

	const handleDisconnect = () => {
		forceDisconnectWallet(); // Use force disconnect to clear all stored data
	};
</script>

<nav class="bg-black border-b border-green-900/30 sticky top-0 z-50 backdrop-blur-sm">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Logo -->
			<div class="flex items-center space-x-4">
				<a href="/" class="flex items-center space-x-2 group">
					<div class="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
						<span class="text-black font-bold text-sm">P</span>
					</div>
					<span class="text-white font-bold text-xl group-hover:text-green-400 transition-colors">
						ProviChain
					</span>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-1">
				{#each visibleNavItems as item}
					<div class="relative group">
						<a
							href={item.href}
							class="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
								{page.url.pathname === item.href 
									? 'bg-green-500/20 text-green-400' 
									: 'text-gray-300 hover:text-white hover:bg-white/5'}"
						>
							{item.label}
						</a>
						
						{#if item.children}
							<div class="absolute top-full left-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
								{#each item.children as child}
									<a
										href={child.href}
										class="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-green-500/10 first:rounded-t-lg last:rounded-b-lg transition-colors"
									>
										{child.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Wallet Connection -->
			<div class="flex items-center space-x-4">
				{#if $isConnected && $user}
					<div class="hidden sm:flex items-center space-x-3">
						<div class="text-right">
							<div class="text-sm font-medium text-white">{$user.name || 'User'}</div>
							<div class="text-xs text-gray-400 capitalize">{$user.role}</div>
						</div>
						<div class="w-8 h-8 rounded-full border-2 border-green-400 bg-green-600 flex items-center justify-center">
							<span class="text-white font-medium text-sm">{$user.role ? $user.role.charAt(0).toUpperCase() : 'U'}</span>
						</div>
						<button
							onclick={handleConnect}
							class="text-gray-400 hover:text-green-400 transition-colors"
							title="Switch Wallet"
							aria-label="Switch to different wallet"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
							</svg>
						</button>
						<button
							onclick={handleDisconnect}
							class="text-gray-400 hover:text-red-400 transition-colors"
							title="Disconnect"
							aria-label="Disconnect wallet"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
							</svg>
						</button>
					</div>
				{:else}
					<button
						onclick={handleConnect}
						class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 
							text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 
							hover:shadow-lg hover:shadow-green-500/25
							flex items-center space-x-2"
					>
						{#if $isLoading}
							<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
						{/if}
						<span>Connect Wallet</span>
					</button>
				{/if}

				<!-- Mobile menu button -->
				<button
					onclick={() => showMobileMenu = !showMobileMenu}
					class="md:hidden text-gray-400 hover:text-white transition-colors"
					aria-label="Toggle mobile menu"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile Navigation -->
	{#if showMobileMenu}
		<div class="md:hidden bg-gray-900 border-t border-gray-700">
			<div class="px-2 pt-2 pb-3 space-y-1">
				{#each visibleNavItems as item}
					<a
						href={item.href}
						onclick={() => showMobileMenu = false}
						class="block px-3 py-2 text-base font-medium rounded-lg transition-colors
							{page.url.pathname === item.href 
								? 'bg-green-500/20 text-green-400' 
								: 'text-gray-300 hover:text-white hover:bg-white/5'}"
					>
						{item.label}
					</a>
					{#if item.children}
						{#each item.children as child}
							<a
								href={child.href}
								onclick={() => showMobileMenu = false}
								class="block px-6 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
							>
								{child.label}
							</a>
						{/each}
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</nav>

<!-- Account Selector Modal - Global positioning -->
{#if showAccountSelector}
	<div class="fixed inset-0 z-[99999] flex items-center justify-center p-4" style="position: fixed;">
		<div 
			class="absolute inset-0 bg-black/70 backdrop-blur-sm" 
			onclick={() => showAccountSelector = false}
			onkeydown={(e) => e.key === 'Escape' && (showAccountSelector = false)}
			role="button"
			tabindex="0"
			aria-label="Close account selector"
		></div>
		<div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full z-[100000]">
			<!-- Modal Header -->
			<div class="px-6 py-4 border-b border-gray-700">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-white text-xl font-bold">Switch Account</h3>
						<p class="text-gray-400 text-sm mt-1">Choose which wallet account to connect</p>
					</div>
					<button
						onclick={() => showAccountSelector = false}
						class="text-gray-400 hover:text-white transition-colors p-1"
						aria-label="Close modal"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Account List -->
			<div class="px-6 py-4">
				<div class="space-y-3 max-h-80 overflow-y-auto">
					{#each availableAccounts as account, index}
						<div class="p-4 bg-gray-800 border border-gray-600 rounded-lg hover:border-green-500/50 transition-colors">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-3">
									<div class="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
										{account.index}
									</div>
									<div>
										<div class="text-white font-medium">{account.name}</div>
										<div class="text-gray-400 text-sm font-mono">{account.shortAddress}</div>
									</div>
								</div>
								<button
									onclick={() => handleAccountSelect(account.index)}
									class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
								>
									Switch
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="px-6 py-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl">
				<div class="flex flex-col gap-3">
					<div class="text-gray-300 text-sm">
						<div class="font-medium text-white mb-2">💡 Account Switching:</div>
						<div class="text-gray-400 space-y-1">
							<p>• Click "Switch" next to any account to connect to it</p>
							<p>• Your app will automatically switch to the selected account</p>
							<p>• Each account has its own roles and permissions</p>
						</div>
					</div>
					<button
						onclick={() => showAccountSelector = false}
						class="w-full px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
					>
						Got it
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
