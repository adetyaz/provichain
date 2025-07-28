<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { user, isConnected } from '$lib/stores/auth';

	const notificationSettings = [
		{
			category: 'Product Updates',
			description: 'Get notified about your products and watchlist items',
			settings: [
				{ name: 'Quality Alerts', enabled: true, description: 'Temperature, handling, or quality issues' },
				{ name: 'Location Updates', enabled: true, description: 'GPS tracking and delivery status' },
				{ name: 'Delivery Confirmations', enabled: true, description: 'When products are delivered' },
				{ name: 'Authenticity Verifications', enabled: false, description: 'Third-party verification results' }
			]
		},
		{
			category: 'Account & Security',
			description: 'Security-related notifications and account updates',
			settings: [
				{ name: 'Login Alerts', enabled: true, description: 'New device or location logins' },
				{ name: 'Wallet Activity', enabled: true, description: 'Wallet connections and transactions' },
				{ name: 'Profile Changes', enabled: true, description: 'Changes to your profile or settings' },
				{ name: 'Security Recommendations', enabled: false, description: 'Tips to improve account security' }
			]
		},
		{
			category: 'Platform Updates',
			description: 'News and updates about the ProviChain platform',
			settings: [
				{ name: 'New Features', enabled: false, description: 'Latest platform features and improvements' },
				{ name: 'Maintenance Notices', enabled: true, description: 'Scheduled maintenance and downtime' },
				{ name: 'Partnership Announcements', enabled: false, description: 'New manufacturers and partners' },
				{ name: 'Newsletter', enabled: false, description: 'Monthly platform newsletter' }
			]
		}
	];

	const privacySettings = [
		{
			category: 'Data Sharing',
			settings: [
				{ name: 'Share Purchase History', enabled: false, description: 'Allow manufacturers to see your purchase patterns' },
				{ name: 'Anonymous Analytics', enabled: true, description: 'Help improve the platform with anonymous usage data' },
				{ name: 'Location Tracking', enabled: true, description: 'Share location for better delivery tracking' },
				{ name: 'Quality Feedback', enabled: true, description: 'Share product feedback with other users' }
			]
		},
		{
			category: 'Profile Visibility',
			settings: [
				{ name: 'Public Profile', enabled: false, description: 'Make your profile visible to other users' },
				{ name: 'Trust Score Display', enabled: true, description: 'Show your trust score on public interactions' },
				{ name: 'Activity Status', enabled: false, description: 'Show when you were last active' },
				{ name: 'Verification Badge', enabled: true, description: 'Display your verification status' }
			]
		}
	];

	const connectedWallets = [
		{
			name: 'MetaMask',
			address: '0x1234...5678',
			network: 'Massa Mainnet',
			status: 'Connected',
			lastUsed: '2 hours ago'
		},
		{
			name: 'Station Wallet',
			address: 'AS12...9876',
			network: 'Massa Testnet',
			status: 'Inactive',
			lastUsed: '3 days ago'
		}
	];

	const apiKeys = [
		{
			name: 'Product Scanner API',
			key: 'pk_live_1234567890abcdef',
			permissions: ['Read Product Data', 'Verify Authenticity'],
			created: '2025-01-15',
			lastUsed: '1 hour ago'
		},
		{
			name: 'Logistics Integration',
			key: 'sk_test_fedcba0987654321',
			permissions: ['Update Location', 'Read Shipments'],
			created: '2024-12-20',
			lastUsed: 'Never'
		}
	];

	const activityLog = [
		{
			action: 'Wallet Connected',
			details: 'Connected MetaMask wallet',
			timestamp: '2025-02-19 10:30 AM',
			ip: '192.168.1.100',
			device: 'Desktop - Chrome'
		},
		{
			action: 'Product Verified',
			details: 'Verified Premium Coffee authenticity',
			timestamp: '2025-02-19 09:15 AM',
			ip: '192.168.1.100',
			device: 'Mobile - Safari'
		},
		{
			action: 'Settings Updated',
			details: 'Changed notification preferences',
			timestamp: '2025-02-18 02:45 PM',
			ip: '192.168.1.100',
			device: 'Desktop - Chrome'
		}
	];
</script>

<PageLayout 
	title="Account Settings" 
	subtitle="Manage your preferences, privacy, and connected services"
>
	<div class="grid lg:grid-cols-4 gap-8">
		<!-- Settings Navigation -->
		<div class="lg:col-span-1">
			<Card title="Settings Menu">
				<nav class="space-y-2">
					<a href="#notifications" class="flex items-center space-x-2 p-2 rounded-lg bg-green-500/20 text-green-400">
						<span>🔔</span>
						<span class="text-sm">Notifications</span>
					</a>
					<a href="#privacy" class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors">
						<span>🔒</span>
						<span class="text-sm">Privacy</span>
					</a>
					<a href="#wallets" class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors">
						<span>💼</span>
						<span class="text-sm">Wallets</span>
					</a>
					<a href="#api" class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors">
						<span>🔑</span>
						<span class="text-sm">API Keys</span>
					</a>
					<a href="#activity" class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors">
						<span>📊</span>
						<span class="text-sm">Activity Log</span>
					</a>
				</nav>
			</Card>
		</div>

		<!-- Settings Content -->
		<div class="lg:col-span-3 space-y-8">
			<!-- Profile Overview -->
			<Card title="Profile Information" description="Your account details and verification status">
				<div class="grid md:grid-cols-2 gap-6">
					<div>
						<label for="display-name" class="block text-gray-300 text-sm mb-2">Display Name</label>
						<input 
							id="display-name"
							type="text" 
							value={$user?.name || 'Anonymous User'}
							class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
						>
					</div>
					<div>
						<label for="email-address" class="block text-gray-300 text-sm mb-2">Email Address</label>
						<input 
							id="email-address"
							type="email" 
							value={$user?.address || 'user@example.com'}
							class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
						>
					</div>
					<div>
						<label for="account-type" class="block text-gray-300 text-sm mb-2">Account Type</label>
						<select id="account-type" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
							<option selected={$user?.role === 'consumer'}>Consumer</option>
							<option selected={$user?.role === 'manufacturer'}>Manufacturer</option>
							<option selected={$user?.role === 'logistics'}>Logistics Provider</option>
						</select>
					</div>
					<div>
						<p class="block text-gray-300 text-sm mb-2">Trust Score</p>
						<div class="flex items-center space-x-2">
							<span class="text-2xl font-bold text-green-400">9.8</span>
							<span class="text-gray-400 text-sm">/ 10</span>
							<span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Verified</span>
						</div>
					</div>
				</div>
				<div class="mt-6 pt-6 border-t border-gray-700">
					<Button>Save Profile Changes</Button>
				</div>
			</Card>

			<!-- Notification Settings -->
			<div id="notifications">
				<Card title="Notification Preferences" description="Control how and when you receive notifications">
					<div class="space-y-6">
						{#each notificationSettings as category}
							<div>
								<h3 class="font-semibold text-white mb-2">{category.category}</h3>
								<p class="text-gray-400 text-sm mb-4">{category.description}</p>
								<div class="space-y-3">
									{#each category.settings as setting}
										<div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
											<div>
												<h4 class="text-white text-sm font-medium">{setting.name}</h4>
												<p class="text-gray-400 text-xs">{setting.description}</p>
											</div>
											<label class="relative inline-flex items-center cursor-pointer">
												<input type="checkbox" checked={setting.enabled} class="sr-only peer">
												<div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
											</label>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</Card>
			</div>

			<!-- Privacy Settings -->
			<div id="privacy">
				<Card title="Privacy Settings" description="Control your data sharing and visibility preferences">
					<div class="space-y-6">
						{#each privacySettings as category}
							<div>
								<h3 class="font-semibold text-white mb-4">{category.category}</h3>
								<div class="space-y-3">
									{#each category.settings as setting}
										<div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
											<div>
												<h4 class="text-white text-sm font-medium">{setting.name}</h4>
												<p class="text-gray-400 text-xs">{setting.description}</p>
											</div>
											<label class="relative inline-flex items-center cursor-pointer">
												<input type="checkbox" checked={setting.enabled} class="sr-only peer">
												<div class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
											</label>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</Card>
			</div>

			<!-- Connected Wallets -->
			<div id="wallets">
				<Card title="Connected Wallets" description="Manage your blockchain wallet connections">
					<div class="space-y-4">
						{#each connectedWallets as wallet}
							<div class="bg-gray-800 rounded-lg p-4">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center space-x-3">
										<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
											<span class="text-white text-sm font-bold">{wallet.name[0]}</span>
										</div>
										<div>
											<h4 class="text-white font-medium">{wallet.name}</h4>
											<p class="text-gray-400 text-xs font-mono">{wallet.address}</p>
										</div>
									</div>
									<span class="px-2 py-1 text-xs rounded-full {
										wallet.status === 'Connected' ? 'bg-green-500/20 text-green-400' :
										'bg-gray-500/20 text-gray-400'
									}">
										{wallet.status}
									</span>
								</div>
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p class="text-gray-400">Network</p>
										<p class="text-white">{wallet.network}</p>
									</div>
									<div>
										<p class="text-gray-400">Last Used</p>
										<p class="text-white">{wallet.lastUsed}</p>
									</div>
								</div>
								<div class="flex gap-2 mt-4">
									<Button variant="outline" size="sm">
										{wallet.status === 'Connected' ? 'Disconnect' : 'Connect'}
									</Button>
									<Button variant="ghost" size="sm">Remove</Button>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-6 pt-6 border-t border-gray-700">
						<Button variant="outline">Add New Wallet</Button>
					</div>
				</Card>
			</div>

			<!-- API Keys -->
			<div id="api">
				<Card title="API Keys" description="Manage API keys for third-party integrations">
					<div class="space-y-4">
						{#each apiKeys as key}
							<div class="bg-gray-800 rounded-lg p-4">
								<div class="flex items-start justify-between mb-2">
									<div>
										<h4 class="text-white font-medium">{key.name}</h4>
										<p class="text-gray-400 text-xs font-mono">{key.key}</p>
									</div>
									<Button variant="ghost" size="sm">Copy</Button>
								</div>
								<div class="mb-3">
									<p class="text-gray-400 text-xs mb-2">Permissions:</p>
									<div class="flex flex-wrap gap-1">
										{#each key.permissions as permission}
											<span class="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
												{permission}
											</span>
										{/each}
									</div>
								</div>
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p class="text-gray-400">Created</p>
										<p class="text-white">{key.created}</p>
									</div>
									<div>
										<p class="text-gray-400">Last Used</p>
										<p class="text-white">{key.lastUsed}</p>
									</div>
								</div>
								<div class="flex gap-2 mt-4">
									<Button variant="outline" size="sm">Regenerate</Button>
									<Button variant="ghost" size="sm">Revoke</Button>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-6 pt-6 border-t border-gray-700">
						<Button variant="outline">Create New API Key</Button>
					</div>
				</Card>
			</div>

			<!-- Activity Log -->
			<div id="activity">
				<Card title="Activity Log" description="Recent account activity and security events">
					<div class="space-y-3">
						{#each activityLog as activity}
							<div class="bg-gray-800 rounded-lg p-3">
								<div class="flex items-start justify-between mb-1">
									<h4 class="text-white text-sm font-medium">{activity.action}</h4>
									<span class="text-gray-400 text-xs">{activity.timestamp}</span>
								</div>
								<p class="text-gray-300 text-sm mb-2">{activity.details}</p>
								<div class="grid grid-cols-2 gap-4 text-xs">
									<div>
										<span class="text-gray-400">IP Address: </span>
										<span class="text-white">{activity.ip}</span>
									</div>
									<div>
										<span class="text-gray-400">Device: </span>
										<span class="text-white">{activity.device}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-6 pt-6 border-t border-gray-700">
						<Button variant="outline">Export Activity Log</Button>
					</div>
				</Card>
			</div>

			<!-- Danger Zone -->
			<Card title="Danger Zone" description="Irreversible actions that affect your account">
				<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
					<div class="space-y-4">
						<div>
							<h4 class="text-red-400 font-medium mb-1">Delete Account</h4>
							<p class="text-gray-300 text-sm mb-3">
								Permanently delete your account and all associated data. This action cannot be undone.
							</p>
							<Button variant="danger" size="sm">Delete Account</Button>
						</div>
						<div class="border-t border-red-500/20 pt-4">
							<h4 class="text-red-400 font-medium mb-1">Export Data</h4>
							<p class="text-gray-300 text-sm mb-3">
								Download all your account data including products, verifications, and activity logs.
							</p>
							<Button variant="outline" size="sm">Export My Data</Button>
						</div>
					</div>
				</div>
			</Card>
		</div>
	</div>
</PageLayout>
