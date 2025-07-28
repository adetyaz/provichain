<script lang="ts">
	import { onMount } from 'svelte';
	import { getWallets, WalletName } from '@massalabs/wallet-provider';
	import { connectWallet } from '$lib/stores/auth';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	let loading = $state(false);
	let walletInfo = $state<any>(null);
	let accounts = $state<any[]>([]);
	let selectedAccount = $state<any>(null);
	let error = $state('');

	async function debugWallet() {
		try {
			loading = true;
			error = '';
			
			console.log('🔍 Starting wallet debug...');
			
			// Get wallets
			const walletList = await getWallets();
			console.log('📱 Available wallets:', walletList.map(w => w.name()));
			
			if (walletList.length === 0) {
				throw new Error('No wallets found');
			}
			
			// Use first available wallet
			const wallet = walletList[0];
			console.log('✅ Using wallet:', wallet.name());
			
			// Get accounts
			const walletAccounts = await wallet.accounts();
			console.log('👥 Wallet accounts:', walletAccounts.length);
			
			// Log each account in detail
			const accountDetails = walletAccounts.map((account, index) => {
				const details = {
					index,
					address: account.address,
					type: typeof account,
					constructor: account.constructor.name,
					methods: Object.getOwnPropertyNames(Object.getPrototypeOf(account))
				};
				console.log(`Account ${index}:`, details);
				return details;
			});
			
			walletInfo = {
				name: wallet.name(),
				type: typeof wallet,
				constructor: wallet.constructor.name,
				methods: Object.getOwnPropertyNames(Object.getPrototypeOf(wallet))
			};
			
			accounts = accountDetails;
			
		} catch (err) {
			console.error('❌ Debug failed:', err);
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}
	
	async function testAccountConnection(index: number) {
		try {
			console.log(`🔗 Switching to account ${index}...`);
			await connectWallet(index);
			console.log('✅ Successfully switched to account', index);
			
			// Update the selected account display
			selectedAccount = {
				index,
				address: accounts[index].address,
				connected: true
			};
			
		} catch (err) {
			console.error('❌ Connection test failed:', err);
			error = err instanceof Error ? err.message : 'Connection failed';
		}
	}
</script>

<div class="min-h-screen bg-black p-8">
	<div class="max-w-4xl mx-auto space-y-6">
		<Card title="Wallet Debug Tool" class="bg-gray-900">
			<div class="space-y-4">
				<Button 
					onclick={debugWallet} 
				
					class="bg-blue-600 hover:bg-blue-700"
				>
					{loading ? 'Debugging...' : 'Debug Wallet'}
				</Button>
				
				{#if error}
					<div class="text-red-400 p-3 bg-red-900/20 rounded">
						Error: {error}
					</div>
				{/if}
			</div>
		</Card>
		
		{#if walletInfo}
			<Card title="Wallet Information" class="bg-gray-900">
				<div class="space-y-2 text-sm">
					<div><strong>Name:</strong> {walletInfo.name}</div>
					<div><strong>Type:</strong> {walletInfo.type}</div>
					<div><strong>Constructor:</strong> {walletInfo.constructor}</div>
					<div><strong>Methods:</strong> {walletInfo.methods.join(', ')}</div>
				</div>
			</Card>
		{/if}
		
		{#if accounts.length > 0}
			<Card title="Available Accounts" class="bg-gray-900">
				<div class="space-y-4">
					{#each accounts as account, index}
						<div class="p-4 bg-gray-800 rounded-lg">
							<div class="flex justify-between items-start mb-2">
								<h3 class="text-lg font-medium text-white">Account {account.index}</h3>
								<Button 
									onclick={() => testAccountConnection(account.index)}
									class="bg-green-600 hover:bg-green-700 text-sm"
								>
									Test Connect
								</Button>
							</div>
							<div class="space-y-1 text-sm text-gray-300">
								<div><strong>Address:</strong> <code class="bg-gray-700 px-1 rounded">{account.address}</code></div>
								<div><strong>Type:</strong> {account.type}</div>
								<div><strong>Constructor:</strong> {account.constructor}</div>
								<div><strong>Methods:</strong> {account.methods.join(', ')}</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		{/if}
		
		{#if selectedAccount}
			<Card title="Selected Account" class="bg-green-900/20 border-green-500">
				<div class="space-y-2 text-sm">
					<div><strong>Index:</strong> {selectedAccount.index}</div>
					<div><strong>Address:</strong> <code class="bg-gray-700 px-1 rounded">{selectedAccount.address}</code></div>
					<div><strong>Status:</strong> <span class="text-green-400">Connected</span></div>
				</div>
			</Card>
		{/if}
		
		<Card title="Instructions" class="bg-gray-900">
			<div class="text-sm text-gray-300 space-y-2">
				<p><strong>✅ Great news!</strong> Your wallet provides access to {accounts.length > 0 ? accounts.length : '?'} accounts.</p>
				<p><strong>🔄 Account Switching:</strong></p>
				<p>• Click "Test Connect" next to any account above to switch to that account</p>
				<p>• Or use the account selector in the main navigation (click your connected wallet button)</p>
				<p>• Each account has its own address and can have different roles in the platform</p>
				<p><strong>📝 What this means:</strong> You can now easily switch between your different wallet accounts without needing to change anything in your wallet extension!</p>
			</div>
		</Card>
	</div>
</div>
