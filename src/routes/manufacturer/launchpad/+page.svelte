<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { checkUserRole, getUserAddress } from '$lib/web3';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Auth state
	let isManufacturer = $state(false);
	let userAddress = $state('');
	let loading = $state(true);

	// Redirect if not authenticated or wrong role
	onMount(async () => {
		try {
			loading = true;
			userAddress = await getUserAddress();
			isManufacturer = await checkUserRole('MANUFACTURER');
			
			if (!userAddress) {
				goto('/connect');
				return;
			}
			
			if (!isManufacturer) {
				goto('/manufacturer'); // Redirect to main page to request role
				return;
			}
		} catch (err) {
			console.error('Auth error:', err);
			goto('/connect');
		} finally {
			loading = false;
		}
	});

	// Form state
	let currentStep = $state(1);
	let isSubmitting = $state(false);
	
	// Product details
	let productName = $state('');
	let productDescription = $state('');
	let batchId = $state('');
	let category = $state('');
	let quantity = $state('');
	let unitPrice = $state('');
	let certificationFiles: FileList | null = $state(null);
	let productImages: FileList | null = $state(null);

	// ASC Configuration
	let enableQualityMonitoring = $state(true);
	let temperatureThreshold = $state('25');
	let humidityThreshold = $state('70');
	let enablePaymentAutomation = $state(true);
	let paymentConditions = $state('delivery_confirmation');
	let enableInsurance = $state(false);
	let insuranceValue = $state('');

	// Legal & Compliance
	let legalEntity = $state('');
	let complianceRegion = $state('');
	let agreedToTerms = $state(false);
	let agreedToCompliance = $state(false);

	const categories = [
		'Food & Beverages',
		'Electronics',
		'Textiles & Fashion',
		'Pharmaceuticals',
		'Automotive',
		'Luxury Goods',
		'Industrial Materials',
		'Other'
	];

	const paymentConditionOptions = [
		{ value: 'delivery_confirmation', label: 'On Delivery Confirmation' },
		{ value: 'quality_passed', label: 'When Quality Check Passes' },
		{ value: 'milestone_based', label: 'Milestone-based Release' },
		{ value: 'custom', label: 'Custom Conditions' }
	];

	const regions = [
		'United States',
		'European Union',
		'United Kingdom',
		'Canada',
		'Australia',
		'Other'
	];

	const nextStep = () => {
		if (currentStep < 4) {
			currentStep++;
		}
	};

	const prevStep = () => {
		if (currentStep > 1) {
			currentStep--;
		}
	};

	const handleSubmit = async () => {
		isSubmitting = true;
		
		// Simulate submission delay
		await new Promise(resolve => setTimeout(resolve, 3000));
		
		// Navigate to success page or product view
		isSubmitting = false;
		goto('/manufacturer/products/new-product-success');
	};

	const generateBatchId = () => {
		const timestamp = Date.now().toString().slice(-6);
		batchId = `PVC-2025-${timestamp}`;
	};
</script>

<PageLayout 
	title="Product Launchpad" 
	subtitle="Tokenize new products and configure autonomous smart contracts"
	maxWidth="2xl"
>
	<!-- Progress Bar -->
	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			{#each Array(4) as _, i}
				<div class="flex items-center {i < 3 ? 'flex-1' : ''}">
					<div class="w-8 h-8 rounded-full flex items-center justify-center {
						currentStep > i + 1 ? 'bg-green-500 text-black' :
						currentStep === i + 1 ? 'bg-green-500 text-black' :
						'bg-gray-700 text-gray-400'
					}">
						{currentStep > i + 1 ? '✓' : i + 1}
					</div>
					{#if i < 3}
						<div class="flex-1 h-0.5 mx-4 {
							currentStep > i + 1 ? 'bg-green-500' : 'bg-gray-700'
						}"></div>
					{/if}
				</div>
			{/each}
		</div>
		<div class="flex justify-between text-sm text-gray-400">
			<span class="{currentStep === 1 ? 'text-green-400' : ''}">Product Details</span>
			<span class="{currentStep === 2 ? 'text-green-400' : ''}">ASC Configuration</span>
			<span class="{currentStep === 3 ? 'text-green-400' : ''}">Legal & Compliance</span>
			<span class="{currentStep === 4 ? 'text-green-400' : ''}">Review & Submit</span>
		</div>
	</div>

	<!-- Step Content -->
	{#if currentStep === 1}
		<!-- Product Details -->
		<Card title="Product Information" description="Enter basic details about your product or batch">
			<div class="space-y-6">
				<div class="grid md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
						<input
							bind:value={productName}
							placeholder="e.g., Premium Organic Coffee Batch"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
							required
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Category *</label>
						<select
							bind:value={category}
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
							required
						>
							<option value="">Select category</option>
							{#each categories as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
					<textarea
						bind:value={productDescription}
						placeholder="Describe your product, its origin, materials, or special features..."
						rows="4"
						class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
					></textarea>
				</div>

				<div class="grid md:grid-cols-3 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Batch ID</label>
						<div class="flex gap-2">
							<input
								bind:value={batchId}
								placeholder="Auto-generated if empty"
								class="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
							/>
							<Button onclick={generateBatchId} variant="outline">
								Generate
							</Button>
						</div>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
						<input
							bind:value={quantity}
							type="number"
							placeholder="e.g., 1000"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Unit Price (USD)</label>
						<input
							bind:value={unitPrice}
							type="number"
							step="0.01"
							placeholder="e.g., 25.99"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
						/>
					</div>
				</div>

				<div class="grid md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Product Images</label>
						<input
							bind:files={productImages}
							type="file"
							multiple
							accept="image/*"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500 file:text-black hover:file:bg-green-600"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Certifications</label>
						<input
							bind:files={certificationFiles}
							type="file"
							multiple
							accept=".pdf,.jpg,.jpeg,.png"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500 file:text-black hover:file:bg-green-600"
						/>
					</div>
				</div>
			</div>
		</Card>

	{:else if currentStep === 2}
		<!-- ASC Configuration -->
		<Card title="Autonomous Smart Contract Configuration" description="Set up automation rules for your supply chain">
			<div class="space-y-8">
				<!-- Quality Monitoring -->
				<div class="border border-gray-700 rounded-lg p-6">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h3 class="text-lg font-semibold text-white">Quality Monitoring</h3>
							<p class="text-gray-400 text-sm">Automatically monitor product conditions</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input bind:checked={enableQualityMonitoring} type="checkbox" class="sr-only peer" />
							<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
						</label>
					</div>
					
					{#if enableQualityMonitoring}
						<div class="grid md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-300 mb-2">Temperature Threshold (°C)</label>
								<input
									bind:value={temperatureThreshold}
									type="number"
									class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-300 mb-2">Humidity Threshold (%)</label>
								<input
									bind:value={humidityThreshold}
									type="number"
									class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
								/>
							</div>
						</div>
					{/if}
				</div>

				<!-- Payment Automation -->
				<div class="border border-gray-700 rounded-lg p-6">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h3 class="text-lg font-semibold text-white">Payment Automation</h3>
							<p class="text-gray-400 text-sm">Automatically release payments when conditions are met</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input bind:checked={enablePaymentAutomation} type="checkbox" class="sr-only peer" />
							<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
						</label>
					</div>
					
					{#if enablePaymentAutomation}
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Payment Conditions</label>
							<select
								bind:value={paymentConditions}
								class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
							>
								{#each paymentConditionOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				<!-- Insurance -->
				<div class="border border-gray-700 rounded-lg p-6">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h3 class="text-lg font-semibold text-white">Insurance Integration</h3>
							<p class="text-gray-400 text-sm">Automatically trigger insurance claims for quality breaches</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input bind:checked={enableInsurance} type="checkbox" class="sr-only peer" />
							<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
						</label>
					</div>
					
					{#if enableInsurance}
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Insurance Value (USD)</label>
							<input
								bind:value={insuranceValue}
								type="number"
								step="0.01"
								placeholder="e.g., 10000.00"
								class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
							/>
						</div>
					{/if}
				</div>
			</div>
		</Card>

	{:else if currentStep === 3}
		<!-- Legal & Compliance -->
		<Card title="Legal & Compliance" description="Complete legal requirements for tokenization">
			<div class="space-y-6">
				<div class="grid md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Legal Entity *</label>
						<input
							bind:value={legalEntity}
							placeholder="Your company or legal entity name"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
							required
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Compliance Region *</label>
						<select
							bind:value={complianceRegion}
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
							required
						>
							<option value="">Select region</option>
							{#each regions as region}
								<option value={region}>{region}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="border border-gray-700 rounded-lg p-6 space-y-4">
					<h3 class="text-lg font-semibold text-white">Legal Attestations</h3>
					
					<label class="flex items-start space-x-3 cursor-pointer">
						<input bind:checked={agreedToTerms} type="checkbox" class="mt-1 w-5 h-5 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500" />
						<div class="text-sm">
							<p class="text-white">
								I confirm that I have legal ownership and authority to tokenize these assets
							</p>
							<p class="text-gray-400 mt-1">
								By checking this, you attest that you are the rightful owner or authorized representative of the products being tokenized.
							</p>
						</div>
					</label>
					
					<label class="flex items-start space-x-3 cursor-pointer">
						<input bind:checked={agreedToCompliance} type="checkbox" class="mt-1 w-5 h-5 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500" />
						<div class="text-sm">
							<p class="text-white">
								I understand and agree to comply with all applicable regulations
							</p>
							<p class="text-gray-400 mt-1">
								This includes but is not limited to securities laws, consumer protection regulations, and international trade requirements in your jurisdiction.
							</p>
						</div>
					</label>
				</div>

				<div class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
					<div class="flex items-start space-x-3">
						<span class="text-yellow-400 text-xl">⚠️</span>
						<div class="text-sm">
							<p class="text-yellow-200 font-semibold mb-1">Legal Notice</p>
							<p class="text-yellow-100">
								Tokenizing real-world assets may be subject to securities regulations. 
								Please consult with legal counsel before proceeding. ProviChain does not provide legal advice.
							</p>
						</div>
					</div>
				</div>
			</div>
		</Card>

	{:else if currentStep === 4}
		<!-- Review & Submit -->
		<Card title="Review & Submit" description="Review your configuration before minting the NFT">
			<div class="space-y-6">
				<!-- Product Summary -->
				<div class="bg-gray-800 rounded-lg p-6">
					<h3 class="text-lg font-semibold text-white mb-4">Product Summary</h3>
					<div class="grid md:grid-cols-2 gap-4 text-sm">
						<div>
							<p class="text-gray-400">Name</p>
							<p class="text-white">{productName || 'Not specified'}</p>
						</div>
						<div>
							<p class="text-gray-400">Category</p>
							<p class="text-white">{category || 'Not specified'}</p>
						</div>
						<div>
							<p class="text-gray-400">Batch ID</p>
							<p class="text-white font-mono">{batchId || 'Will be auto-generated'}</p>
						</div>
						<div>
							<p class="text-gray-400">Quantity</p>
							<p class="text-white">{quantity || 'Not specified'}</p>
						</div>
					</div>
				</div>

				<!-- ASC Summary -->
				<div class="bg-gray-800 rounded-lg p-6">
					<h3 class="text-lg font-semibold text-white mb-4">Autonomous Features</h3>
					<div class="space-y-2 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Quality Monitoring</span>
							<span class="{enableQualityMonitoring ? 'text-green-400' : 'text-gray-500'}">
								{enableQualityMonitoring ? '✓ Enabled' : '✗ Disabled'}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Payment Automation</span>
							<span class="{enablePaymentAutomation ? 'text-green-400' : 'text-gray-500'}">
								{enablePaymentAutomation ? '✓ Enabled' : '✗ Disabled'}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Insurance Integration</span>
							<span class="{enableInsurance ? 'text-green-400' : 'text-gray-500'}">
								{enableInsurance ? '✓ Enabled' : '✗ Disabled'}
							</span>
						</div>
					</div>
				</div>

				<!-- Legal Summary -->
				<div class="bg-gray-800 rounded-lg p-6">
					<h3 class="text-lg font-semibold text-white mb-4">Compliance Status</h3>
					<div class="space-y-2 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Legal Entity</span>
							<span class="text-white">{legalEntity || 'Not specified'}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Compliance Region</span>
							<span class="text-white">{complianceRegion || 'Not specified'}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">Legal Attestations</span>
							<span class="{agreedToTerms && agreedToCompliance ? 'text-green-400' : 'text-red-400'}">
								{agreedToTerms && agreedToCompliance ? '✓ Complete' : '✗ Incomplete'}
							</span>
						</div>
					</div>
				</div>

				<!-- Estimated Costs -->
				<div class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-6">
					<h3 class="text-lg font-semibold text-white mb-4">Estimated Costs</h3>
					<div class="space-y-2 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-gray-300">NFT Minting</span>
							<span class="text-white">~0.01 MAS</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">ASC Deployment</span>
							<span class="text-white">~0.05 MAS</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-300">IPFS Storage</span>
							<span class="text-white">~$0.50 USD</span>
						</div>
						<div class="border-t border-gray-600 pt-2 mt-2">
							<div class="flex items-center justify-between font-semibold">
								<span class="text-white">Total Estimated</span>
								<span class="text-green-400">~0.06 MAS + $0.50 USD</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Navigation Buttons -->
	<div class="flex justify-between mt-8">
		<div>
			{#if currentStep > 1}
				<Button onclick={prevStep} variant="outline">
					Previous
				</Button>
			{/if}
		</div>
		
		<div class="flex gap-3">
			{#if currentStep < 4}
				<Button onclick={nextStep} disabled={
					(currentStep === 1 && (!productName || !category)) ||
					(currentStep === 3 && (!legalEntity || !complianceRegion || !agreedToTerms || !agreedToCompliance))
				}>
					Next
				</Button>
			{:else}
				<Button 
					onclick={handleSubmit} 
					loading={isSubmitting}
					disabled={isSubmitting}
					size="lg"
				>
					{isSubmitting ? 'Minting NFT...' : 'Launch Product'}
				</Button>
			{/if}
		</div>
	</div>
</PageLayout>
