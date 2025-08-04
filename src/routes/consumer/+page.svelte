<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import RouteGuard from '$lib/components/RouteGuard.svelte';
	import TransferProduct from '$lib/components/TransferProduct.svelte';
	import NotificationPanel from '$lib/components/NotificationPanel.svelte';
	import { getUserAddress, getUserProducts } from '$lib/web3';
	import { getConsumerRequests } from '$lib/services/marketplace-service';
	import { ownershipService } from '$lib/services/ownership-service';
	import { notificationService } from '$lib/services/notification-service';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Product } from '$lib/types';

	// State management
	let userAddress: string | null = $state(null);
	let loading = $state(true);
	let error = $state('');
	let userProducts = $state<any[]>([]);
	let userRequests = $state<any[]>([]);
	let ownedProductIds = $state<string[]>([]);
	let unreadNotifications = $state(0);

	// Transfer modal state
	let showTransferModal = $state(false);
	let selectedProduct: Product | null = $state(null);

	// Notification panel state
	let showNotifications = $state(false);

	// Load user data on mount
	onMount(async () => {
		try {
			const address = await getUserAddress();
			userAddress = address;

			// Subscribe to notifications
			notificationService.subscribe((notifications) => {
				unreadNotifications = notifications.filter((n) => !n.read).length;
			});

			// Add a test notification to demonstrate the system
			setTimeout(() => {
				notificationService.addNotification({
					title: '🎉 Welcome to Consumer Dashboard',
					message: 'Your product ownership tracking and notification system is now active!',
					type: 'success',
					actionUrl: '/consumer'
				});
			}, 2000);

			// Load user's products and requests
			await Promise.all([loadUserProducts(), loadUserRequests(), loadOwnedProducts()]);
		} catch (err) {
			console.error('Authentication check failed:', err);
			goto('/connect');
		} finally {
			loading = false;
		}
	});

	async function loadUserProducts() {
		try {
			const products = await getUserProducts(userAddress!);
			userProducts = products;
		} catch (err) {
			console.error('Failed to load user products:', err);
			error = 'Failed to load your products';
		}
	}

	async function loadUserRequests() {
		try {
			console.log('🔄 Refreshing consumer requests...');
			const requests = await getConsumerRequests(userAddress!);
			userRequests = requests;
			console.log('✅ Consumer requests refreshed:', requests);
		} catch (err) {
			console.error('Failed to load user requests:', err);
		}
	}

	async function loadOwnedProducts() {
		try {
			if (userAddress) {
				const owned = await ownershipService.getUserOwnedProducts(userAddress);
				ownedProductIds = owned;
			}
		} catch (err) {
			console.error('Failed to load owned products:', err);
		}
	}

	function handleTransferProduct(product: Product) {
		selectedProduct = product;
		showTransferModal = true;
	}

	function handleTransferInitiated(event: CustomEvent) {
		const { transactionId, product, toAddress, transferType } = event.detail;

		// Add notification
		notificationService.addTransferUpdate(
			product.id,
			'initiated',
			userAddress || undefined,
			toAddress
		);

		// Refresh data
		loadOwnedProducts();

		console.log('Transfer initiated:', { transactionId, product, toAddress, transferType });
	}

	// Manual refresh function for testing
	async function handleRefreshRequests() {
		console.log('🔄 Manual refresh triggered by user');
		await loadUserRequests();
	}

	const stats = $derived.by(() => {
		const totalProducts = userProducts.length;
		const pendingRequests = userRequests.filter((r) => r.status === 'pending').length;
		const approvedRequests = userRequests.filter((r) => r.status === 'approved').length;
		const thisMonth = new Date().getMonth();
		const thisYear = new Date().getFullYear();
		const thisMonthProducts = userProducts.filter((p) => {
			const productDate = new Date(p.purchaseDate || p.deliveryDate || new Date());
			return productDate.getMonth() === thisMonth && productDate.getFullYear() === thisYear;
		}).length;

		return [
			{
				label: 'Products Owned',
				value: totalProducts.toString(),
				change: `+${thisMonthProducts}`,
				icon: '📦'
			},
			{
				label: 'Pending Requests',
				value: pendingRequests.toString(),
				change: 'active',
				icon: '⏳'
			},
			{
				label: 'Approved Requests',
				value: approvedRequests.toString(),
				change: 'this month',
				icon: '✅'
			},
			{
				label: 'Total Requests',
				value: userRequests.length.toString(),
				change: 'all time',
				icon: '�'
			}
		];
	});

	const ownedProducts = $derived(userProducts);

	// Watchlist - will be implemented with real data from blockchain
	const watchlist: any[] = [];

	const recentActivity: any[] = [
		// Activity will be loaded from user's actual blockchain transactions
	];

	const quickActions = $derived.by(() => [
		{
			title: 'Scan Product',
			description: 'Verify a new product',
			href: '/scan',
			icon: '📱',
			color: 'green'
		},
		{
			title: 'Browse Marketplace',
			description: 'Discover verified products',
			href: '/marketplace',
			icon: '🛍️',
			color: 'blue'
		},
		{
			title: 'Quality Report',
			description: 'Report product issues',
			href: '/consumer/report',
			icon: '📝',
			color: 'yellow'
		},
		{
			title: 'Notifications',
			description: `${unreadNotifications} unread`,
			action: () => (showNotifications = !showNotifications),
			icon: '🔔',
			color: unreadNotifications > 0 ? 'red' : 'gray',
			badge: unreadNotifications > 0 ? unreadNotifications : undefined
		}
	]);
</script>

<RouteGuard requiredRole="consumer">
	<PageLayout
		title="Consumer Dashboard"
		subtitle="Welcome back, Consumer • Track your products and verify authenticity"
	>
		{#if loading}
			<div class="py-8 text-center">
				<div class="text-blue-400">Loading your dashboard...</div>
			</div>
		{:else if error}
			<div class="mb-6 rounded-lg border border-red-500 bg-red-900/20 p-4">
				<div class="text-red-400">{error}</div>
			</div>
		{:else}
			<!-- Quick Stats -->
			<section class="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
				{#each stats as stat}
					<div
						class="rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 transition-all hover:border-cyan-500/30"
					>
						<div class="mb-2 flex items-center justify-between">
							<span class="text-2xl">{stat.icon}</span>
							<span
								class="rounded-full px-2 py-1 text-xs {stat.change.startsWith('+')
									? 'bg-green-500/20 text-green-400'
									: stat.change === '0%'
										? 'bg-gray-500/20 text-gray-400'
										: 'bg-red-500/20 text-red-400'}"
							>
								{stat.change}
							</span>
						</div>
						<div class="mb-1 text-2xl font-bold text-white">{stat.value}</div>
						<div class="text-sm text-gray-400">{stat.label}</div>
					</div>
				{/each}
			</section>

			<!-- Quick Actions -->
			<section class="mb-8">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-white">Quick Actions</h2>
					<Button onclick={handleRefreshRequests} class="bg-blue-600 hover:bg-blue-700">
						🔄 Refresh Requests
					</Button>
				</div>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{#each quickActions as action}
						<Card title={action.title} description={action.description}>
							<div class="flex items-center justify-between">
								<span class="text-3xl">{action.icon}</span>
								{#if action.href}
									<Button href={action.href} size="sm">Go</Button>
								{:else if action.action}
									<button
										onclick={action.action}
										class="relative rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
									>
										{#if action.badge}
											<span
												class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white"
											>
												{action.badge}
											</span>
										{/if}
										Go
									</button>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			</section>

			<div class="grid gap-8 lg:grid-cols-3">
				<!-- Owned Products -->
				<div class="lg:col-span-2">
					<Card title="My Products" description="Products you own and their current status">
						<div class="space-y-4">
							{#each ownedProducts as product}
								<div class="hover:bg-gray-750 rounded-lg bg-gray-800 p-4 transition-colors">
									<div class="mb-3 flex items-start justify-between">
										<div>
											<h3 class="font-semibold text-white">{product.name}</h3>
											<p class="text-sm text-gray-400">by {product.manufacturer}</p>
											<p class="font-mono text-xs text-gray-400">{product.id}</p>
										</div>
										<span
											class="rounded-full px-2 py-1 text-xs {product.status === 'Delivered'
												? 'bg-green-500/20 text-green-400'
												: product.status === 'In Use'
													? 'bg-blue-500/20 text-blue-400'
													: 'bg-gray-500/20 text-gray-400'}"
										>
											{product.status}
										</span>
									</div>

									<div class="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
										<div>
											<p class="text-gray-400">Purchase Date</p>
											<p class="text-white">{product.purchaseDate}</p>
										</div>
										<div>
											<p class="text-gray-400">Delivered</p>
											<p class="text-white">{product.deliveryDate}</p>
										</div>
										<div>
											<p class="text-gray-400">Quality</p>
											<p class="text-green-400">{product.quality}</p>
										</div>
										<div>
											<p class="text-gray-400">Value</p>
											<p class="font-semibold text-white">{product.value}</p>
										</div>
									</div>

									<div class="flex gap-2">
										<Button href="/product/{product.id}" variant="outline" size="sm">
											View Details
										</Button>
										{#if ownedProductIds.includes(product.id)}
											<button
												onclick={() => handleTransferProduct(product)}
												class="rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
											>
												Transfer
											</button>
										{:else}
											<Button href="/consumer/resell/{product.id}" variant="ghost" size="sm">
												Request
											</Button>
										{/if}
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-6 border-t border-gray-700 pt-4">
							<Button href="/consumer/products" variant="outline" class="w-full">
								View All Products
							</Button>
						</div>
					</Card>
				</div>

				<!-- Watchlist & Activity -->
				<div>
					<Card title="Watchlist" description="Products you're tracking">
						<div class="space-y-3">
							{#each watchlist as item}
								<div class="rounded-lg bg-gray-800 p-3">
									<div class="mb-2 flex items-start justify-between">
										<div>
											<h4 class="text-sm font-semibold text-white">{item.name}</h4>
											<p class="text-xs text-gray-400">{item.manufacturer}</p>
										</div>
										<span class="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
											{item.status}
										</span>
									</div>
									<div class="text-xs">
										<p class="text-gray-400">
											Location: <span class="text-white">{item.currentLocation}</span>
										</p>
										<p class="text-gray-400">
											ETA: <span class="text-white">{item.estimatedDelivery}</span>
										</p>
									</div>
									<div class="mt-2 flex gap-1">
										<Button href="/product/{item.id}" variant="ghost" size="sm" class="text-xs">
											View
										</Button>
										<Button
											href="/consumer/watchlist/remove/{item.id}"
											variant="ghost"
											size="sm"
											class="text-xs"
										>
											Remove
										</Button>
									</div>
								</div>
							{/each}
						</div>

						<Button href="/consumer/watchlist" variant="outline" size="sm" class="mt-4 w-full">
							Manage Watchlist
						</Button>
					</Card>

					<!-- Recent Activity -->
					<div class="mt-6">
						<Card title="Recent Activity" description="Your recent interactions">
							<div class="space-y-3">
								{#each recentActivity as activity}
									<div class="flex items-start space-x-3 rounded-lg bg-gray-800 p-2">
										<span class="text-lg">{activity.icon}</span>
										<div class="flex-1">
											<p class="text-sm text-white">{activity.message}</p>
											<p class="mt-1 text-xs text-gray-400">{activity.product} • {activity.time}</p>
										</div>
									</div>
								{/each}
							</div>

							<Button href="/consumer/activity" variant="outline" size="sm" class="mt-4 w-full">
								View All Activity
							</Button>
						</Card>
					</div>

					<!-- Trust Score -->
					<div class="mt-6">
						<Card title="Trust Score" description="Your consumer reputation">
							<div class="mb-4 text-center">
								<div class="mb-2 text-4xl font-bold text-green-400">9.8</div>
								<p class="text-sm text-gray-400">Trusted Consumer</p>
							</div>

							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-gray-300">Verifications</span>
									<span class="text-green-400">47</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-300">Reviews</span>
									<span class="text-green-400">12</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-300">Quality Reports</span>
									<span class="text-blue-400">3</span>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</div>
		{/if}
	</PageLayout>
</RouteGuard>

<!-- Transfer Product Modal -->
{#if showTransferModal && selectedProduct}
	<TransferProduct
		product={selectedProduct}
		bind:isOpen={showTransferModal}
		on:transfer-initiated={handleTransferInitiated}
	/>
{/if}

<!-- Notification Panel Modal -->
{#if showNotifications}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={() => (showNotifications = false)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showNotifications = false)}
	>
		<div
			class="mx-4 max-h-[80vh] w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && (showNotifications = false)}
			role="dialog"
			tabindex="0"
		>
			<div class="border-b border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">Notifications</h2>
					<button
						onclick={() => (showNotifications = false)}
						class="text-gray-400 transition-colors hover:text-gray-600"
						aria-label="Close notifications"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>
			<div class="p-4">
				<NotificationPanel maxDisplay={10} />
			</div>
		</div>
	</div>
{/if}
