<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import RouteGuard from '$lib/components/RouteGuard.svelte';

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
			expectedDelivery: '2025-01-30',
			temperature: '22°C',
			humidity: '45%'
		},
		{
			id: 'SHP-2025-002',
			product: 'Organic Tea Collection',
			origin: 'Sri Lanka',
			destination: 'London, UK',
			status: 'Quality Check',
			currentLocation: 'Port of Colombo',
			expectedDelivery: '2025-02-05',
			temperature: '20°C',
			humidity: '50%'
		},
		{
			id: 'SHP-2025-003',
			product: 'Swiss Luxury Watches',
			origin: 'Switzerland',
			destination: 'Tokyo, Japan',
			status: 'Pending Pickup',
			currentLocation: 'Geneva Warehouse',
			expectedDelivery: '2025-02-12',
			temperature: '18°C',
			humidity: '40%'
		}
	];

	const qualityAlerts = [
		{
			id: 'ALT-001',
			shipment: 'SHP-2025-001',
			product: 'Premium Coffee',
			type: 'Temperature',
			severity: 'medium',
			message: 'Temperature exceeded threshold for 15 minutes',
			time: '2 hours ago'
		},
		{
			id: 'ALT-002',
			shipment: 'SHP-2025-004',
			product: 'Pharmaceutical Batch',
			type: 'Humidity',
			severity: 'high',
			message: 'Humidity levels critical - immediate action required',
			time: '4 hours ago'
		}
	];

	const quickActions = [
		{
			title: 'New Shipment',
			description: 'Create shipment record',
			href: '/logistics/shipments/new',
			icon: '📦',
			color: 'blue'
		},
		{
			title: 'Update Location',
			description: 'Track current position',
			href: '/logistics/tracking',
			icon: '📍',
			color: 'green'
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

<RouteGuard requiredRole="logistics">
	<PageLayout 
		title="Logistics Dashboard" 
		subtitle="Welcome back, Logistics Provider • Track shipments and manage deliveries"
	>
		<!-- Quick Stats -->
		<section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
			{#each stats as stat}
				<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/30 transition-all">
					<div class="flex items-center justify-between mb-2">
						<span class="text-2xl">{stat.icon}</span>
						<span class="text-xs text-green-400 font-medium">{stat.change}</span>
					</div>
					<h3 class="text-white text-2xl font-bold mb-1">{stat.value}</h3>
					<p class="text-gray-400 text-sm">{stat.label}</p>
				</div>
			{/each}
		</section>

		<!-- Quick Actions -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-white mb-6">Quick Actions</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each quickActions as action}
					<a
						href={action.href}
						class="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-{action.color}-500/50 hover:bg-{action.color}-500/5 transition-all group"
					>
						<div class="text-3xl mb-3 group-hover:scale-110 transition-transform">{action.icon}</div>
						<h3 class="text-white font-semibold mb-1 group-hover:text-{action.color}-400 transition-colors">{action.title}</h3>
						<p class="text-gray-400 text-sm">{action.description}</p>
					</a>
				{/each}
			</div>
		</section>

		<!-- Active Shipments -->
		<div class="grid lg:grid-cols-2 gap-8 mb-8">
			<Card title="Active Shipments" class="bg-gray-800 border-gray-700">
				<div class="space-y-4">
					{#each activeShipments as shipment}
						<div class="border border-gray-700 rounded-lg p-4 hover:border-blue-500/30 transition-colors">
							<div class="flex justify-between items-start mb-3">
								<div>
									<h4 class="text-white font-semibold">{shipment.product}</h4>
									<p class="text-gray-400 text-sm">{shipment.id}</p>
								</div>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
									{shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
									shipment.status === 'Quality Check' ? 'bg-yellow-100 text-yellow-800' :
									'bg-gray-100 text-gray-800'}">
									{shipment.status}
								</span>
							</div>
							
							<div class="grid grid-cols-2 gap-2 text-sm mb-3">
								<div>
									<span class="text-gray-400">From:</span>
									<span class="text-white ml-1">{shipment.origin}</span>
								</div>
								<div>
									<span class="text-gray-400">To:</span>
									<span class="text-white ml-1">{shipment.destination}</span>
								</div>
								<div>
									<span class="text-gray-400">Location:</span>
									<span class="text-white ml-1">{shipment.currentLocation}</span>
								</div>
								<div>
									<span class="text-gray-400">Expected:</span>
									<span class="text-white ml-1">{shipment.expectedDelivery}</span>
								</div>
							</div>

							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-4 text-xs">
									<span class="text-gray-400">🌡️ {shipment.temperature}</span>
									<span class="text-gray-400">💧 {shipment.humidity}</span>
								</div>
								<Button size="sm" variant="outline">
									Track
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Quality Alerts -->
			<Card title="Quality Alerts" class="bg-gray-800 border-gray-700">
				<div class="space-y-4">
					{#each qualityAlerts as alert}
						<div class="border border-gray-700 rounded-lg p-4 
							{alert.severity === 'high' ? 'border-red-500/30 bg-red-500/5' : 
							alert.severity === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' : 
							'border-gray-500/30'}">
							<div class="flex justify-between items-start mb-2">
								<div>
									<h4 class="text-white font-semibold">{alert.product}</h4>
									<p class="text-gray-400 text-sm">{alert.shipment}</p>
								</div>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
									{alert.severity === 'high' ? 'bg-red-100 text-red-800' :
									alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
									'bg-gray-100 text-gray-800'}">
									{alert.severity}
								</span>
							</div>
							
							<p class="text-gray-300 text-sm mb-3">{alert.message}</p>
							
							<div class="flex items-center justify-between">
								<span class="text-gray-400 text-xs">{alert.time}</span>
								<Button size="sm" class="bg-blue-600 hover:bg-blue-700">
									Resolve
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>
	</PageLayout>
</RouteGuard>
