<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { user, isConnected } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect if not authenticated or wrong role
	onMount(() => {
		if (!$isConnected || ($user?.role !== 'consumer' && $user?.role !== 'admin')) {
			goto('/connect');
		}
	});

	const stats = [
		{ label: 'Products Owned', value: '12', change: '+3%', icon: '📦' },
		{ label: 'Verified This Month', value: '47', change: '+15%', icon: '✅' },
		{ label: 'Watchlisted', value: '8', change: '+2%', icon: '👁️' },
		{ label: 'Alerts Received', value: '2', change: '-50%', icon: '🔔' }
	];

	const ownedProducts = [
		{
			id: 'PVC-2025-001',
			name: 'Premium Organic Coffee',
			manufacturer: 'Sustainable Farms Co.',
			status: 'Delivered',
			purchaseDate: '2025-02-10',
			deliveryDate: '2025-02-16',
			quality: 'Excellent',
			value: '$125.00'
		},
		{
			id: 'PVC-2025-007',
			name: 'Swiss Artisan Chocolate',
			manufacturer: 'Alpine Confections',
			status: 'Consumed',
			purchaseDate: '2025-01-25',
			deliveryDate: '2025-01-30',
			quality: 'Perfect',
			value: '$89.99'
		},
		{
			id: 'PVC-2025-012',
			name: 'Organic Tea Collection',
			manufacturer: 'Mountain Tea Co.',
			status: 'In Use',
			purchaseDate: '2025-02-01',
			deliveryDate: '2025-02-05',
			quality: 'Excellent',
			value: '$67.50'
		}
	];

	const watchlist = [
		{
			id: 'PVC-2025-015',
			name: 'Limited Edition Watch',
			manufacturer: 'Swiss Timepieces',
			currentLocation: 'Geneva Workshop',
			status: 'In Production',
			estimatedDelivery: '2025-03-15',
			notifyOnStatus: ['Quality Check', 'Shipped', 'Delivered']
		},
		{
			id: 'PVC-2025-018',
			name: 'Vintage Wine Collection',
			manufacturer: 'Bordeaux Vineyards',
			currentLocation: 'French Countryside',
			status: 'Aging Process',
			estimatedDelivery: '2025-12-01',
			notifyOnStatus: ['Bottled', 'Shipped']
		}
	];

	const recentActivity = [
		{
			type: 'verification',
			message: 'Verified authenticity of Premium Coffee',
			product: 'PVC-2025-001',
			time: '2 hours ago',
			icon: '✅'
		},
		{
			type: 'alert',
			message: 'Quality alert resolved for Tea Collection',
			product: 'PVC-2025-012',
			time: '1 day ago',
			icon: '🔔'
		},
		{
			type: 'purchase',
			message: 'Added Swiss Watch to watchlist',
			product: 'PVC-2025-015',
			time: '3 days ago',
			icon: '👁️'
		}
	];

	const quickActions = [
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
			title: 'Settings',
			description: 'Manage notifications',
			href: '/settings',
			icon: '⚙️',
			color: 'gray'
		}
	];
</script>

<PageLayout 
	title="Consumer Dashboard" 
	subtitle="Welcome back, {$user?.name || 'Consumer'} • Track your products and verify authenticity"
>
	<!-- Quick Stats -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
		{#each stats as stat}
			<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/30 transition-all">
				<div class="flex items-center justify-between mb-2">
					<span class="text-2xl">{stat.icon}</span>
					<span class="text-xs px-2 py-1 rounded-full {stat.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : stat.change === '0%' ? 'bg-gray-500/20 text-gray-400' : 'bg-red-500/20 text-red-400'}">
						{stat.change}
					</span>
				</div>
				<div class="text-2xl font-bold text-white mb-1">{stat.value}</div>
				<div class="text-gray-400 text-sm">{stat.label}</div>
			</div>
		{/each}
	</section>

	<!-- Quick Actions -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold text-white mb-4">Quick Actions</h2>
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each quickActions as action}
				<Card title={action.title} description={action.description}>
					<div class="flex items-center justify-between">
						<span class="text-3xl">{action.icon}</span>
						<Button href={action.href} size="sm">
							Go
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	</section>

	<div class="grid lg:grid-cols-3 gap-8">
		<!-- Owned Products -->
		<div class="lg:col-span-2">
			<Card title="My Products" description="Products you own and their current status">
				<div class="space-y-4">
					{#each ownedProducts as product}
						<div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-white">{product.name}</h3>
									<p class="text-gray-400 text-sm">by {product.manufacturer}</p>
									<p class="text-gray-400 text-xs font-mono">{product.id}</p>
								</div>
								<span class="px-2 py-1 text-xs rounded-full {
									product.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
									product.status === 'In Use' ? 'bg-blue-500/20 text-blue-400' :
									'bg-gray-500/20 text-gray-400'
								}">
									{product.status}
								</span>
							</div>
							
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
									<p class="text-white font-semibold">{product.value}</p>
								</div>
							</div>
							
							<div class="flex gap-2">
								<Button href="/product/{product.id}" variant="outline" size="sm">
									View Details
								</Button>
								<Button href="/consumer/resell/{product.id}" variant="ghost" size="sm">
									Resell
								</Button>
							</div>
						</div>
					{/each}
				</div>
				
				<div class="mt-6 pt-4 border-t border-gray-700">
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
						<div class="bg-gray-800 rounded-lg p-3">
							<div class="flex items-start justify-between mb-2">
								<div>
									<h4 class="font-semibold text-white text-sm">{item.name}</h4>
									<p class="text-gray-400 text-xs">{item.manufacturer}</p>
								</div>
								<span class="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
									{item.status}
								</span>
							</div>
							<div class="text-xs">
								<p class="text-gray-400">Location: <span class="text-white">{item.currentLocation}</span></p>
								<p class="text-gray-400">ETA: <span class="text-white">{item.estimatedDelivery}</span></p>
							</div>
							<div class="flex gap-1 mt-2">
								<Button href="/product/{item.id}" variant="ghost" size="sm" class="text-xs">
									View
								</Button>
								<Button href="/consumer/watchlist/remove/{item.id}" variant="ghost" size="sm" class="text-xs">
									Remove
								</Button>
							</div>
						</div>
					{/each}
				</div>
				
				<Button href="/consumer/watchlist" variant="outline" size="sm" class="w-full mt-4">
					Manage Watchlist
				</Button>
			</Card>

			<!-- Recent Activity -->
			<div class="mt-6">
				<Card title="Recent Activity" description="Your recent interactions">
					<div class="space-y-3">
						{#each recentActivity as activity}
							<div class="flex items-start space-x-3 p-2 bg-gray-800 rounded-lg">
								<span class="text-lg">{activity.icon}</span>
								<div class="flex-1">
									<p class="text-white text-sm">{activity.message}</p>
									<p class="text-gray-400 text-xs mt-1">{activity.product} • {activity.time}</p>
								</div>
							</div>
						{/each}
					</div>
					
					<Button href="/consumer/activity" variant="outline" size="sm" class="w-full mt-4">
						View All Activity
					</Button>
				</Card>
			</div>

			<!-- Trust Score -->
			<div class="mt-6">
				<Card title="Trust Score" description="Your consumer reputation">
					<div class="text-center mb-4">
						<div class="text-4xl font-bold text-green-400 mb-2">9.8</div>
						<p class="text-gray-400 text-sm">Trusted Consumer</p>
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
</PageLayout>
