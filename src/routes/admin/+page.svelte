<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { user, isConnected } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect if not authenticated or wrong role
	onMount(() => {
		if (!$isConnected || $user?.role !== 'admin') {
			goto('/connect');
		}
	});

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
			productsCount: 45,
			trustScore: 9.2
		},
		{
			id: 'USR-002',
			name: 'Global Logistics Ltd.',
			email: 'ops@globallogistics.com',
			role: 'Logistics',
			status: 'Active',
			joinDate: '2024-11-22',
			shipmentsCount: 128,
			trustScore: 8.9
		},
		{
			id: 'USR-003',
			name: 'John Smith',
			email: 'john.smith@email.com',
			role: 'Consumer',
			status: 'Active',
			joinDate: '2025-01-10',
			verificationsCount: 23,
			trustScore: 9.5
		},
		{
			id: 'USR-004',
			name: 'Alpine Confections',
			email: 'info@alpineconfections.ch',
			role: 'Manufacturer',
			status: 'Pending',
			joinDate: '2025-02-01',
			productsCount: 0,
			trustScore: 0
		}
	];

	const recentActivities = [
		{
			type: 'user_registration',
			message: 'New manufacturer registered',
			details: 'Alpine Confections joined the platform',
			time: '2 hours ago',
			icon: '👥'
		},
		{
			type: 'compliance_alert',
			message: 'Compliance review required',
			details: 'Product batch PVC-2025-019 flagged for review',
			time: '4 hours ago',
			icon: '⚠️'
		},
		{
			type: 'system_update',
			message: 'Smart contract updated',
			details: 'ASC v2.1 deployed successfully',
			time: '1 day ago',
			icon: '🔧'
		},
		{
			type: 'security',
			message: 'Security scan completed',
			details: 'No vulnerabilities detected',
			time: '2 days ago',
			icon: '🛡️'
		}
	];

	const systemHealth = [
		{ name: 'Massa Blockchain', status: 'Healthy', uptime: '99.9%', latency: '0.8s' },
		{ name: 'DeWeb Storage', status: 'Healthy', uptime: '99.7%', usage: '67%' },
		{ name: 'ASC Network', status: 'Healthy', uptime: '99.8%', contracts: '2,847' },
		{ name: 'IPFS Gateway', status: 'Warning', uptime: '98.2%', sync: 'Delayed' }
	];

	const complianceReports = [
		{
			type: 'Food Safety',
			status: 'Compliant',
			lastAudit: '2025-02-01',
			nextDue: '2025-05-01',
			coverage: '100%'
		},
		{
			type: 'GDPR Compliance',
			status: 'Compliant',
			lastAudit: '2025-01-15',
			nextDue: '2025-04-15',
			coverage: '98%'
		},
		{
			type: 'Financial Audit',
			status: 'In Review',
			lastAudit: '2024-11-30',
			nextDue: '2025-02-28',
			coverage: '95%'
		}
	];

	const quickActions = [
		{
			title: 'User Management',
			description: 'Manage platform users',
			href: '/admin/users',
			icon: '👥',
			color: 'blue'
		},
		{
			title: 'Product Oversight',
			description: 'Review flagged products',
			href: '/admin/products',
			icon: '📦',
			color: 'green'
		},
		{
			title: 'System Monitoring',
			description: 'Check system health',
			href: '/admin/system',
			icon: '🖥️',
			color: 'purple'
		},
		{
			title: 'Compliance Review',
			description: 'Audit and compliance',
			href: '/admin/compliance',
			icon: '📋',
			color: 'yellow'
		}
	];
</script>

<PageLayout 
	title="Admin Dashboard" 
	subtitle="Welcome back, {$user?.name || 'Administrator'} • Platform overview and management"
>
	<!-- Platform Stats -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
		{#each platformStats as stat}
			<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500/30 transition-all">
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
		<!-- User Management -->
		<div class="lg:col-span-2">
			<Card title="User Management" description="Recent user activities and pending approvals">
				<div class="space-y-4">
					{#each userManagement as user}
						<div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-white">{user.name}</h3>
									<p class="text-gray-400 text-sm">{user.email}</p>
									<p class="text-gray-400 text-xs font-mono">{user.id}</p>
								</div>
								<div class="text-right">
									<span class="px-2 py-1 text-xs rounded-full {
										user.status === 'Active' ? 'bg-green-500/20 text-green-400' :
										user.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
										'bg-red-500/20 text-red-400'
									}">
										{user.status}
									</span>
									<p class="text-gray-400 text-xs mt-1">{user.role}</p>
								</div>
							</div>
							
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
								<div>
									<p class="text-gray-400">Joined</p>
									<p class="text-white">{user.joinDate}</p>
								</div>
								<div>
									<p class="text-gray-400">Activity</p>
									<p class="text-white">
										{user.role === 'Manufacturer' ? `${user.productsCount} products` :
										 user.role === 'Logistics' ? `${user.shipmentsCount} shipments` :
										 `${user.verificationsCount} verifications`}
									</p>
								</div>
								<div>
									<p class="text-gray-400">Trust Score</p>
									<p class="text-green-400">{user.trustScore}/10</p>
								</div>
								<div>
									<p class="text-gray-400">Status</p>
									<p class="text-white">{user.status}</p>
								</div>
							</div>
							
							<div class="flex gap-2">
								<Button href="/admin/users/{user.id}" variant="outline" size="sm">
									Manage User
								</Button>
								{#if user.status === 'Pending'}
									<Button href="/admin/approve/{user.id}" variant="ghost" size="sm">
										Approve
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
				
				<div class="mt-6 pt-4 border-t border-gray-700">
					<Button href="/admin/users" variant="outline" class="w-full">
						View All Users
					</Button>
				</div>
			</Card>
		</div>

		<!-- System Health & Activities -->
		<div>
			<Card title="System Health" description="Platform infrastructure status">
				<div class="space-y-3">
					{#each systemHealth as system}
						<div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
							<div>
								<h4 class="font-semibold text-white text-sm">{system.name}</h4>
								<p class="text-gray-400 text-xs">Uptime: {system.uptime}</p>
							</div>
							<span class="px-2 py-1 text-xs rounded-full {
								system.status === 'Healthy' ? 'bg-green-500/20 text-green-400' :
								system.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' :
								'bg-red-500/20 text-red-400'
							}">
								{system.status}
							</span>
						</div>
					{/each}
				</div>
				
				<Button href="/admin/system" variant="outline" size="sm" class="w-full mt-4">
					View System Details
				</Button>
			</Card>

			<!-- Recent Activities -->
			<div class="mt-6">
				<Card title="Recent Activities" description="Platform events and alerts">
					<div class="space-y-3">
						{#each recentActivities as activity}
							<div class="flex items-start space-x-3 p-2 bg-gray-800 rounded-lg">
								<span class="text-lg">{activity.icon}</span>
								<div class="flex-1">
									<p class="text-white text-sm">{activity.message}</p>
									<p class="text-gray-400 text-xs">{activity.details}</p>
									<p class="text-gray-500 text-xs mt-1">{activity.time}</p>
								</div>
							</div>
						{/each}
					</div>
					
					<Button href="/admin/activities" variant="outline" size="sm" class="w-full mt-4">
						View All Activities
					</Button>
				</Card>
			</div>

			<!-- Compliance Status -->
			<div class="mt-6">
				<Card title="Compliance Status" description="Regulatory and audit reports">
					<div class="space-y-3">
						{#each complianceReports as report}
							<div class="bg-gray-800 rounded-lg p-3">
								<div class="flex items-center justify-between mb-2">
									<h4 class="font-semibold text-white text-sm">{report.type}</h4>
									<span class="px-2 py-1 text-xs rounded-full {
										report.status === 'Compliant' ? 'bg-green-500/20 text-green-400' :
										report.status === 'In Review' ? 'bg-yellow-500/20 text-yellow-400' :
										'bg-red-500/20 text-red-400'
									}">
										{report.status}
									</span>
								</div>
								<div class="text-xs space-y-1">
									<p class="text-gray-400">Last Audit: <span class="text-white">{report.lastAudit}</span></p>
									<p class="text-gray-400">Next Due: <span class="text-white">{report.nextDue}</span></p>
									<p class="text-gray-400">Coverage: <span class="text-green-400">{report.coverage}</span></p>
								</div>
							</div>
						{/each}
					</div>
					
					<Button href="/admin/compliance" variant="outline" size="sm" class="w-full mt-4">
						View Compliance Details
					</Button>
				</Card>
			</div>
		</div>
	</div>
</PageLayout>
