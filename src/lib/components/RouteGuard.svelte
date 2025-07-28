<!-- RouteGuard.svelte - Component to protect routes based on user roles -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user, isConnected, updateUserRoleFromBlockchain } from '$lib/stores/auth';
	import Button from './Button.svelte';
	import Card from './Card.svelte';

	// Props
	interface Props {
		requiredRole?: 'manufacturer' | 'logistics' | 'consumer' | 'admin';
		requireConnection?: boolean;
		redirectTo?: string;
		children: any;
	}

	let { 
		requiredRole, 
		requireConnection = true, 
		redirectTo = '/connect',
		children 
	}: Props = $props();

	let loading = $state(true);
	let error = $state('');
	let hasAccess = $state(false);

	onMount(async () => {
		try {
			loading = true;
			error = '';

			// Check wallet connection
			if (requireConnection && !$isConnected) {
				error = 'Wallet connection required';
				setTimeout(() => goto(redirectTo), 2000);
				return;
			}

			// If no specific role required, grant access
			if (!requiredRole) {
				hasAccess = true;
				return;
			}

			// Update role from blockchain if connected
			if ($isConnected) {
				await updateUserRoleFromBlockchain(true); // Auto-assign consumer for route access
			}

			// Check if user has required role
			if ($user?.role === requiredRole) {
				hasAccess = true;
			} else {
				error = `This page requires ${requiredRole} role. Your current role: ${$user?.role || 'none'}`;
				setTimeout(() => goto(redirectTo), 3000);
			}
		} catch (err) {
			console.error('Route guard error:', err);
			error = 'Access check failed';
			setTimeout(() => goto(redirectTo), 2000);
		} finally {
			loading = false;
		}
	});

	function handleGoToConnect() {
		goto('/connect');
	}
</script>

{#if loading}
	<div class="min-h-screen bg-black flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
			<div class="text-green-400 text-lg">Checking access permissions...</div>
		</div>
	</div>
{:else if error}
	<div class="min-h-screen bg-black flex items-center justify-center px-4">
		<Card title="Access Denied" class="bg-gray-800 border-red-500 max-w-md w-full text-center">
			<div class="space-y-4">
				<div class="text-6xl">🚫</div>
				<div class="text-red-400 text-lg font-medium">Access Denied</div>
				<div class="text-gray-300">{error}</div>
				
				{#if !$isConnected}
					<div class="pt-4">
						<Button onclick={handleGoToConnect} class="bg-green-600 hover:bg-green-700">
							Connect Wallet
						</Button>
					</div>
				{:else if !$user?.role}
					<div class="pt-4">
						<Button onclick={handleGoToConnect} class="bg-blue-600 hover:bg-blue-700">
							Assign Role
						</Button>
					</div>
				{/if}
				
				<div class="text-sm text-gray-400">
					Redirecting in 3 seconds...
				</div>
			</div>
		</Card>
	</div>
{:else if hasAccess}
	{@render children()}
{:else}
	<div class="min-h-screen bg-black flex items-center justify-center">
		<div class="text-center">
			<div class="text-gray-400 text-lg">Loading...</div>
		</div>
	</div>
{/if}
