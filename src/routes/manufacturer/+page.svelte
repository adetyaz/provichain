<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { user, isConnected } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect if not authenticated or wrong role
	onMount(() => {
		if (!$isConnected || ($user?.role !== 'manufacturer' && $user?.role !== 'admin')) {
			goto('/connect');
		}
	});

	const stats = [
		{ label: 'Active Products', value: '156', change: '+12%', icon: '📦' },
		{ label: 'Total Batches', value: '2,347', change: '+8%', icon: '🏷️' },
		{ label: 'ASCs Running', value: '89', change: '+23%', icon: '🤖' },
		{ label: 'Quality Alerts', value: '3', change: '-45%', icon: '⚠️' }
	];

	const recentProducts = [
		{
			id: 'PVC-2025-003',
			name: 'Premium Coffee Batch #2025-003',
			status: 'In Transit',
			location: 'Port of Newark',
			temperature: '23°C',
			quality: 'Good',
			lastUpdate: '2 hours ago'
		},
		{
			id: 'PVC-2025-004',
			name: 'Organic Tea Collection',
			status: 'Quality Check',
			location: 'Processing Facility',
			temperature: '22°C',
			quality: 'Excellent',
			lastUpdate: '4 hours ago'
		},
		{
			id: 'PVC-2025-005',
			name: 'Artisan Chocolate Bars',
			status: 'Delivered',
			location: 'NYC Distribution',
			temperature: '21°C',
			quality: 'Perfect',
			lastUpdate: '1 day ago'
		}
	];

	const recentAlerts = [
		{
			type: 'warning',
			message: 'Temperature spike detected in Batch #2025-003',
			product: 'Premium Coffee',
			time: '1 hour ago'
		},
		{
			type: 'success',
			message: 'Payment released for delivered batch #2025-005',
			product: 'Artisan Chocolate',
			time: '1 day ago'
		},
		{
			type: 'info',
			message: 'Quality inspection passed for Tea Collection',
			product: 'Organic Tea',
			time: '2 days ago'
		}
	];

	const quickActions = [
		{
			title: 'Launch New Product',
			description: 'Start tokenizing a new product or batch',
			href: '/manufacturer/launchpad',
			icon: '🚀',
			color: 'green'
		},
		{
			title: 'Build ASC',
			description: 'Create autonomous smart contracts',
			href: '/manufacturer/asc-builder',
			icon: '⚙️',
			color: 'blue'
		},
		{
			title: 'View Analytics',
			description: 'Analyze supply chain performance',
			href: '/analytics',
			icon: '📊',
			color: 'purple'
		},
		{
			title: 'Manage Products',
			description: 'View and update all your products',
			href: '/manufacturer/products',
			icon: '📦',
			color: 'emerald'
		}
	];
</script>

<PageLayout 
	title="Manufacturer Dashboard" 
	subtitle="Welcome back, {$user?.name || 'Manufacturer'} • Manage your tokenized products and supply chains"
>
	<!-- Quick Stats -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
		{#each stats as stat}
			<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-green-500/30 transition-all">
				<div class="flex items-center justify-between mb-2">
					<span class="text-2xl">{stat.icon}</span>
					<span class="text-xs px-2 py-1 rounded-full {stat.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
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
		<!-- Recent Products -->
		<div class="lg:col-span-2">
			<Card title="Recent Products" description="Your latest tokenized products and their status">
				<div class="space-y-4">
					{#each recentProducts as product}
						<div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-white">{product.name}</h3>
									<p class="text-gray-400 text-sm font-mono">{product.id}</p>
								</div>
								<span class="px-2 py-1 text-xs rounded-full {
									product.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
									product.status === 'In Transit' ? 'bg-blue-500/20 text-blue-400' :
									'bg-yellow-500/20 text-yellow-400'
								}">
									{product.status}
								</span>
							</div>
							
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div>
									<p class="text-gray-400">Location</p>
									<p class="text-white">{product.location}</p>
								</div>
								<div>
									<p class="text-gray-400">Temperature</p>
									<p class="text-blue-400">{product.temperature}</p>
								</div>
								<div>
									<p class="text-gray-400">Quality</p>
									<p class="text-green-400">{product.quality}</p>
								</div>
								<div>
									<p class="text-gray-400">Updated</p>
									<p class="text-gray-300">{product.lastUpdate}</p>
								</div>
							</div>
							
							<div class="flex gap-2 mt-4">
								<Button href="/manufacturer/products/{product.id}" variant="outline" size="sm">
									View Details
								</Button>
								<Button href="/product/{product.id}" variant="ghost" size="sm">
									Public View
								</Button>
							</div>
						</div>
					{/each}
				</div>
				
				<div class="mt-6 pt-4 border-t border-gray-700">
					<Button href="/manufacturer/products" variant="outline" class="w-full">
						View All Products
					</Button>
				</div>
			</Card>
		</div>

		<!-- Alerts & Notifications -->
		<div>
			<Card title="Recent Alerts" description="Important notifications from your ASCs">
				<div class="space-y-3">
					{#each recentAlerts as alert}
						<div class="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
							<div class="flex-shrink-0 w-2 h-2 rounded-full mt-2 {
								alert.type === 'warning' ? 'bg-yellow-400' :
								alert.type === 'success' ? 'bg-green-400' :
								'bg-blue-400'
							}"></div>
							<div class="flex-1">
								<p class="text-white text-sm">{alert.message}</p>
								<p class="text-gray-400 text-xs mt-1">{alert.product} • {alert.time}</p>
							</div>
						</div>
					{/each}
				</div>
				
				<Button href="/notifications" variant="outline" size="sm" class="w-full mt-4">
					View All Notifications
				</Button>
			</Card>

			<!-- Quick Links -->
			<div class="mt-6">
				<Card title="Resources" description="Helpful links and documentation">
					<div class="space-y-2">
						<Button href="/docs/api" variant="ghost" size="sm" class="w-full justify-start">
							API Documentation
						</Button>
						<Button href="/developers" variant="ghost" size="sm" class="w-full justify-start">
							Developer Tools
						</Button>
						<Button href="/compliance" variant="ghost" size="sm" class="w-full justify-start">
							Compliance Center
						</Button>
						<Button href="/settings" variant="ghost" size="sm" class="w-full justify-start">
							Account Settings
						</Button>
					</div>
				</Card>
			</div>
		</div>
	</div>
</PageLayout>
