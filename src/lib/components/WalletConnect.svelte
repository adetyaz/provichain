<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		connectWallet, 
		disconnectWallet, 
		isConnected, 
		isLoading, 
		user, 
		walletError,
		checkWalletAvailability,
		setUserRole 
	} from '$lib/stores/auth';
	import Button from './Button.svelte';

	let walletAvailable = false;
	let showRoleSelector = false;

	// Check wallet availability on mount
	onMount(async () => {
		walletAvailable = await checkWalletAvailability();
		if (!walletAvailable) {
			console.log('⚠️ No Massa wallet detected');
		}
	});

	const handleConnect = async () => {
		try {
			await connectWallet();
			// Show role selector after successful connection
			if ($user && !$user.role) {
				showRoleSelector = true;
			}
		} catch (error) {
			console.error('Connection failed:', error);
		}
	};

	const handleDisconnect = () => {
		disconnectWallet();
		showRoleSelector = false;
	};

	const selectRole = (role: 'manufacturer' | 'logistics' | 'consumer' | 'admin') => {
		setUserRole(role);
		showRoleSelector = false;
	};

	// Reactive statement to handle role selection
	$: if ($user?.role && showRoleSelector) {
		showRoleSelector = false;
	}
</script>

{#if !walletAvailable}
	<!-- Wallet Not Available -->
	<div class="wallet-status error">
		<div class="flex items-center space-x-2">
			<div class="w-3 h-3 bg-red-500 rounded-full"></div>
			<span class="text-red-400">No Massa wallet detected</span>
		</div>
		<p class="text-sm text-gray-400 mt-2">
			Please install <a 
				href="https://station.massa.net/" 
				target="_blank" 
				rel="noopener noreferrer"
				class="text-green-400 hover:text-green-300 underline"
			>
				MassaStation
			</a> to continue
		</p>
	</div>
{:else if $isLoading}
	<!-- Loading State -->
	<div class="wallet-status loading">
		<div class="flex items-center space-x-2">
			<div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
			<span class="text-yellow-400">Connecting wallet...</span>
		</div>
	</div>
{:else if $walletError}
	<!-- Error State -->
	<div class="wallet-status error">
		<div class="flex items-center space-x-2">
			<div class="w-3 h-3 bg-red-500 rounded-full"></div>
			<span class="text-red-400">Connection failed</span>
		</div>
		<p class="text-sm text-gray-400 mt-2">{$walletError}</p>
		<Button onclick={handleConnect} variant="outline" size="sm" class="mt-3">
			Try Again
		</Button>
	</div>
{:else if !$isConnected}
	<!-- Not Connected -->
	<Button onclick={handleConnect} variant="primary" size="lg">
		<span class="flex items-center space-x-2">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			<span>Connect Wallet</span>
		</span>
	</Button>
{:else if showRoleSelector}
	<!-- Role Selection -->
	<div class="role-selector">
		<h3 class="text-lg font-semibold text-white mb-4">Select Your Role</h3>
		<div class="grid grid-cols-2 gap-3">
			<button 
				on:click={() => selectRole('manufacturer')}
				class="role-button"
			>
				<div class="text-2xl mb-2">🏭</div>
				<div class="font-medium">Manufacturer</div>
				<div class="text-xs text-gray-400">Create & track products</div>
			</button>
			
			<button 
				on:click={() => selectRole('logistics')}
				class="role-button"
			>
				<div class="text-2xl mb-2">🚚</div>
				<div class="font-medium">Logistics</div>
				<div class="text-xs text-gray-400">Handle shipments</div>
			</button>
			
			<button 
				on:click={() => selectRole('consumer')}
				class="role-button"
			>
				<div class="text-2xl mb-2">👤</div>
				<div class="font-medium">Consumer</div>
				<div class="text-xs text-gray-400">Verify products</div>
			</button>
			
			<button 
				on:click={() => selectRole('admin')}
				class="role-button"
			>
				<div class="text-2xl mb-2">⚙️</div>
				<div class="font-medium">Admin</div>
				<div class="text-xs text-gray-400">Platform management</div>
			</button>
		</div>
	</div>
{:else}
	<!-- Connected State -->
	<div class="wallet-connected">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="w-3 h-3 bg-green-500 rounded-full"></div>
				<div>
					<div class="text-white font-medium">
						{$user?.name || 'Connected'}
					</div>
					<div class="text-sm text-gray-400">
						{$user?.address.slice(0, 8)}...{$user?.address.slice(-6)}
					</div>
				</div>
				{#if $user?.role}
					<div class="role-badge">
						{$user.role}
					</div>
				{/if}
			</div>
			
			<div class="flex items-center space-x-2">
				{#if $user?.role}
					<Button 
						onclick={() => (showRoleSelector = true)} 
						variant="ghost" 
						size="sm"
					>
						Change Role
					</Button>
				{/if}
				<Button onclick={handleDisconnect} variant="outline" size="sm">
					Disconnect
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.wallet-status {
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid;
	}
	
	.wallet-status.error {
		border-color: rgb(127 29 29 / 0.3);
		background-color: rgb(127 29 29 / 0.1);
	}
	
	.wallet-status.loading {
		border-color: rgb(113 63 18 / 0.3);
		background-color: rgb(113 63 18 / 0.1);
	}
	
	.wallet-connected {
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgb(20 83 45 / 0.3);
		background-color: rgb(20 83 45 / 0.1);
	}
	
	.role-selector {
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid rgb(55 65 81);
		background-color: rgb(31 41 55 / 0.5);
	}
	
	.role-button {
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgb(75 85 99);
		background-color: rgb(55 65 81 / 0.5);
		text-align: center;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	
	.role-button:hover {
		background-color: rgb(55 65 81);
		border-color: rgb(34 197 94 / 0.5);
	}
	
	.role-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background-color: rgb(20 83 45 / 0.3);
		color: rgb(74 222 128);
		border: 1px solid rgb(20 83 45 / 0.5);
	}
</style>