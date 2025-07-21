<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { user, isConnected } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect if not authenticated or wrong role
	onMount(() => {
		if (!$isConnected || ($user?.role !== 'logistics' && $user?.role !== 'admin')) {
			goto('/connect');
		}
	});

	const stats = [
		{ label: 'Active Shipments', value: '23', change: '+5%', icon: '🚛' },
		{ label: 'Deliveries Today', value: '8', change: '+12%', icon: '📦' },
		{ label: 'On-Time Rate', value: '96%', change: '+2%', icon: '⏱️' },
		{ label: 'Avg Temperature', value: '22°C', change: '0%', icon: '🌡️' }
	];

	const activeShipments = [
		{
			id: 'SHP-2025-001',
			product: 'Premium Coffee Batch #2025-003',
			origin: 'Costa Rica',
			destination: 'New York, USA',
			status: 'In Transit',
			currentLocation: 'Atlantic Ocean',
			eta: '2 days',
			temperature: '23°C',
			lastUpdate: '30 mins ago'
		},
		{
			id: 'SHP-2025-002',
			product: 'Swiss Watch Collection',
			origin: 'Geneva, Switzerland',
			destination: 'Tokyo, Japan',
			status: 'Customs Clearance',
			currentLocation: 'Narita Airport',
			eta: '1 day',
			temperature: '20°C',
			lastUpdate: '2 hours ago'
		},
		{
			id: 'SHP-2025-003',
			product: 'Organic Tea Leaves',
			origin: 'Darjeeling, India',
			destination: 'London, UK',
			status: 'Quality Check',
			currentLocation: 'London Port',
			eta: 'Today',
			temperature: '22°C',
			lastUpdate: '1 hour ago'
		}
	];

	const recentAlerts = [
		{
			type: 'warning',
			message: 'Temperature spike in shipment SHP-2025-001',
			shipment: 'Premium Coffee',
			time: '30 mins ago',
			action: 'Cooling system activated'
		},
		{
			type: 'success',
			message: 'Payment released for completed delivery',
			shipment: 'Swiss Watch',
			time: '2 hours ago',
			action: 'Auto-payment completed'
		},
		{
			type: 'info',
			message: 'GPS location updated for SHP-2025-003',
			shipment: 'Organic Tea',
			time: '1 hour ago',
			action: 'Location confirmed'
		}
	];

	const quickActions = [
		{
			title: 'Update Location',
			description: 'Log current shipment location',
			href: '/logistics/shipments',
			icon: '📍',
			color: 'green'
		},
		{
			title: 'View Routes',
			description: 'Optimize delivery routes',
			href: '/logistics/routes',
			icon: '🗺️',
			color: 'blue'
		},
		{
			title: 'Quality Report',
			description: 'Log inspection results',
			href: '/logistics/quality',
			icon: '✅',
			color: 'purple'
		},
		{
			title: 'Emergency Alert',
			description: 'Report issues or delays',
			href: '/logistics/emergency',
			icon: '🚨',
			color: 'red'
		}
	];
</script>

<PageLayout 
	title="Logistics Dashboard" 
	subtitle="Welcome back, {$user?.name || 'Logistics Provider'} • Track shipments and manage deliveries"
>
	<!-- Quick Stats -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
		{#each stats as stat}
			<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/30 transition-all">
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
						<Button href={action.href} size="sm" variant={action.color === 'red' ? 'danger' : 'primary'}>
							Go
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	</section>

	<div class="grid lg:grid-cols-3 gap-8">
		<!-- Active Shipments -->
		<div class="lg:col-span-2">
			<Card title="Active Shipments" description="Your current shipments and their status">
				<div class="space-y-4">
					{#each activeShipments as shipment}
						<div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-white">{shipment.product}</h3>
									<p class="text-gray-400 text-sm font-mono">{shipment.id}</p>
								</div>
								<span class="px-2 py-1 text-xs rounded-full {
									shipment.status === 'In Transit' ? 'bg-blue-500/20 text-blue-400' :
									shipment.status === 'Quality Check' ? 'bg-yellow-500/20 text-yellow-400' :
									'bg-orange-500/20 text-orange-400'
								}">
									{shipment.status}
								</span>
							</div>
							
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
								<div>
									<p class="text-gray-400">Route</p>
									<p class="text-white">{shipment.origin} → {shipment.destination}</p>
								</div>
								<div>
									<p class="text-gray-400">Current Location</p>
									<p class="text-white">{shipment.currentLocation}</p>
								</div>
								<div>
									<p class="text-gray-400">ETA</p>
									<p class="text-white">{shipment.eta}</p>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4 text-sm mb-4">
								<div>
									<p class="text-gray-400">Temperature</p>
									<p class="text-blue-400">{shipment.temperature}</p>
								</div>
								<div>
									<p class="text-gray-400">Last Updated</p>
									<p class="text-gray-300">{shipment.lastUpdate}</p>
								</div>
							</div>
							
							<div class="flex gap-2">
								<Button href="/logistics/shipments/{shipment.id}" variant="outline" size="sm">
									Update Status
								</Button>
								<Button href="/product/{shipment.id}" variant="ghost" size="sm">
									View Product
								</Button>
							</div>
						</div>
					{/each}
				</div>
				
				<div class="mt-6 pt-4 border-t border-gray-700">
					<Button href="/logistics/shipments" variant="outline" class="w-full">
						View All Shipments
					</Button>
				</div>
			</Card>
		</div>

		<!-- Alerts & Notifications -->
		<div>
			<Card title="Recent Alerts" description="Important notifications from your shipments">
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
								<p class="text-gray-400 text-xs mt-1">{alert.shipment} • {alert.time}</p>
								{#if alert.action}
									<p class="text-green-400 text-xs mt-1">Action: {alert.action}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				
				<Button href="/notifications" variant="outline" size="sm" class="w-full mt-4">
					View All Notifications
				</Button>
			</Card>

			<!-- Performance Metrics -->
			<div class="mt-6">
				<Card title="This Month" description="Your performance metrics">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Deliveries</span>
							<span class="text-white font-semibold">156</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">On-time Rate</span>
							<span class="text-green-400 font-semibold">96%</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Quality Score</span>
							<span class="text-green-400 font-semibold">9.8/10</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Revenue</span>
							<span class="text-white font-semibold">$45,230</span>
						</div>
					</div>
					
					<Button href="/analytics" variant="outline" size="sm" class="w-full mt-4">
						View Detailed Analytics
					</Button>
				</Card>
			</div>

			<!-- Quick Links -->
			<div class="mt-6">
				<Card title="Resources" description="Helpful links and tools">
					<div class="space-y-2">
						<Button href="/logistics/routes" variant="ghost" size="sm" class="w-full justify-start">
							Route Optimizer
						</Button>
						<Button href="/logistics/weather" variant="ghost" size="sm" class="w-full justify-start">
							Weather Forecast
						</Button>
						<Button href="/compliance" variant="ghost" size="sm" class="w-full justify-start">
							Compliance Docs
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
