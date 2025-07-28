<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import RouteGuard from '$lib/components/RouteGuard.svelte';

	const platformStats = [
		{ label: 'Total Products', value: '2,847', change: '+23%', icon: '📦' },
		{ label: 'Active Users', value: '1,234', change: '+15%', icon: '👥' },
		{ label: 'Verifications Today', value: '89', change: '+8%', icon: '✅' },
		{ label: 'Revenue This Month', value: '$47K', change: '+31%', icon: '💰' }
	];

	const userManagement = [
		{
			id: 'USR-001',
			name: 'Sustainable Farms Co.',
			email: 'contact@sustainablefarms.com',
			role: 'Manufacturer',
			status: 'Active',
			joinDate: '2024-12-15',
			products: 45
		},
		{
			id: 'USR-002',
			name: 'Global Logistics Ltd.',
			email: 'ops@globallogistics.com',
			role: 'Logistics',
			status: 'Active',
			joinDate: '2024-11-20',
			shipments: 128
		},
		{
			id: 'USR-003',
			name: 'Premium Retailers Inc.',
			email: 'admin@premiumretail.com',
			role: 'Consumer',
			status: 'Pending',
			joinDate: '2025-01-10',
			purchases: 12
		}
	];

	const systemHealth = [
		{ service: 'Blockchain Node', status: 'Healthy', uptime: '99.9%', icon: '⛓️' },
		{ service: 'IPFS Storage', status: 'Healthy', uptime: '99.8%', icon: '📁' },
		{ service: 'Smart Contracts', status: 'Warning', uptime: '98.5%', icon: '📜' },
		{ service: 'API Gateway', status: 'Healthy', uptime: '99.9%', icon: '🌐' }
	];

	const adminActions = [
		{
			title: 'Workflow Management',
			description: 'Manage product requests and shipments',
			href: '/admin/workflow',
			icon: '🔄',
			color: 'green'
		},
		{
			title: 'User Management',
			description: 'Manage user roles and permissions',
			href: '/admin/users',
			icon: '👥',
			color: 'blue'
		},
		{
			title: 'System Monitoring',
			description: 'Monitor platform health',
			href: '/admin/monitoring',
			icon: '📊',
			color: 'green'
		},
		{
			title: 'Smart Contracts',
			description: 'Deploy and manage contracts',
			href: '/admin/contracts',
			icon: '📜',
			color: 'purple'
		},
		{
			title: 'Reports',
			description: 'Generate platform reports',
			href: '/admin/reports',
			icon: '📋',
			color: 'yellow'
		}
	];
</script>

<RouteGuard requiredRole="admin">
	<PageLayout 
		title="Admin Dashboard" 
		subtitle="Welcome back, Administrator • Platform overview and management"
	>
		<!-- Platform Stats -->
		<section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
			{#each platformStats as stat}
				<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500/30 transition-all">
					<div class="flex items-center justify-between mb-2">
						<span class="text-2xl">{stat.icon}</span>
						<span class="text-xs text-green-400 font-medium">{stat.change}</span>
					</div>
					<h3 class="text-white text-2xl font-bold mb-1">{stat.value}</h3>
					<p class="text-gray-400 text-sm">{stat.label}</p>
				</div>
			{/each}
		</section>

		<!-- Admin Actions -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-white mb-6">Quick Actions</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each adminActions as action}
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

		<!-- Main Content Grid -->
		<div class="grid lg:grid-cols-2 gap-8 mb-8">
			<!-- User Management -->
			<Card title="User Management" class="bg-gray-800 border-gray-700">
				<div class="space-y-4">
					{#each userManagement as user}
						<div class="border border-gray-700 rounded-lg p-4 hover:border-purple-500/30 transition-colors">
							<div class="flex justify-between items-start mb-3">
								<div>
									<h4 class="text-white font-semibold">{user.name}</h4>
									<p class="text-gray-400 text-sm">{user.email}</p>
								</div>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
									{user.status === 'Active' ? 'bg-green-600 text-green-100' :
									user.status === 'Pending' ? 'bg-yellow-600 text-yellow-100' :
									'bg-gray-600 text-gray-100'}">>
									{user.status}
								</span>
							</div>
							
							<div class="grid grid-cols-2 gap-2 text-sm mb-3">
								<div>
									<span class="text-gray-400">Role:</span>
									<span class="text-white ml-1">{user.role}</span>
								</div>
								<div>
									<span class="text-gray-400">Joined:</span>
									<span class="text-white ml-1">{user.joinDate}</span>
								</div>
								<div>
									<span class="text-gray-400">Activity:</span>
									<span class="text-white ml-1">
										{#if user.products}{user.products} products{/if}
										{#if user.shipments}{user.shipments} shipments{/if}
										{#if user.purchases}{user.purchases} purchases{/if}
									</span>
								</div>
							</div>

							<div class="flex justify-end space-x-2">
								<Button size="sm" variant="outline">Edit</Button>
								<Button size="sm" class="bg-purple-600 hover:bg-purple-700">Manage</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- System Health -->
			<Card title="System Health" class="bg-gray-800 border-gray-700">
				<div class="space-y-4">
					{#each systemHealth as service}
						<div class="border border-gray-700 rounded-lg p-4 
							{service.status === 'Healthy' ? 'border-green-500/30 bg-green-500/5' : 
							service.status === 'Warning' ? 'border-yellow-500/30 bg-yellow-500/5' : 
							'border-red-500/30 bg-red-500/5'}">
							<div class="flex justify-between items-center mb-2">
								<div class="flex items-center space-x-3">
									<span class="text-2xl">{service.icon}</span>
									<div>
										<h4 class="text-white font-semibold">{service.service}</h4>
										<p class="text-gray-400 text-sm">Uptime: {service.uptime}</p>
									</div>
								</div>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
									{service.status === 'Healthy' ? 'bg-green-100 text-green-800' :
									service.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
									'bg-red-100 text-red-800'}">
									{service.status}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>

		<!-- Recent Activity -->
		<Card title="Recent Activity" class="bg-gray-800 border-gray-700">
			<div class="space-y-3">
				<div class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
					<div class="flex items-center space-x-3">
						<span class="text-green-400">✅</span>
						<span class="text-white">New manufacturer verified: Sustainable Farms Co.</span>
					</div>
					<span class="text-gray-400 text-sm">2 hours ago</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
					<div class="flex items-center space-x-3">
						<span class="text-blue-400">🚛</span>
						<span class="text-white">Shipment SHP-2025-001 delivered successfully</span>
					</div>
					<span class="text-gray-400 text-sm">4 hours ago</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
					<div class="flex items-center space-x-3">
						<span class="text-yellow-400">⚠️</span>
						<span class="text-white">Quality alert resolved for product PVC-2025-003</span>
					</div>
					<span class="text-gray-400 text-sm">6 hours ago</span>
				</div>
			</div>
		</Card>
	</PageLayout>
</RouteGuard>
