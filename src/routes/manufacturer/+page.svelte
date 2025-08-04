<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import RouteGuard from '$lib/components/RouteGuard.svelte';
	import { mintProduct, getManufacturerProducts, getUserAddress } from '$lib';
	import { uploadImageToPinata } from '$lib/ipfs/pinata-client';
	import { getPendingRequests } from '$lib/services/marketplace-service';
	import { debugRequestStatus, debugAllRequestsForManufacturer } from '$lib/debug-blockchain';
	import { debugApprovalWorkflow, debugContractState } from '$lib/debug-approval';
	import { testSmartContractDirectly, debugRequestStorage } from '$lib/debug-contract';
	import {
		waitForOperationConfirmation,
		checkMassaNetworkStatus,
		retryApprovalWithBetterFee
	} from '$lib/operation-monitor';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let userAddress = $state('');
	let loading = $state(true);
	let minting = $state(false);
	let error = $state('');
	let success = $state('');
	let totalProducts = $state(0);
	let pendingRequests = $state<any[]>([]);

	// Image upload states
	let selectedImage = $state<File | null>(null);
	let imagePreview = $state<string>('');
	let uploadingImage = $state(false);
	let imageUploadProgress = $state(0);

	let productForm = $state({
		id: '',
		name: '',
		batch: '',
		quantity: 1,
		description: '',
		category: '',
		image: '', // Will store IPFS hash
		// Advanced Configuration
		enableQualityMonitoring: true,
		temperatureThreshold: '25',
		humidityThreshold: '70',
		enablePaymentAutomation: false,
		paymentConditions: 'delivery_confirmation',
		enableInsurance: false,
		insuranceValue: ''
	});

	let isFormValid = $derived(
		productForm.name.trim() !== '' && productForm.batch.trim() !== '' && productForm.quantity > 0
	);

	onMount(async () => {
		try {
			loading = true;
			error = '';

			userAddress = await getUserAddress();

			if (!userAddress) {
				goto('/connect');
				return;
			}

			const products = await getManufacturerProducts(userAddress);
			totalProducts = products.length;

			// Load pending requests
			await loadPendingRequests();

			productForm.id = generateProductId();
		} catch (err) {
			error =
				'Failed to load manufacturer data: ' + (err instanceof Error ? err.message : String(err));
			console.error('Manufacturer page error:', err);
		} finally {
			loading = false;
		}
	});

	function generateProductId() {
		const timestamp = Date.now().toString();
		const randomNum = Math.floor(Math.random() * 1000)
			.toString()
			.padStart(3, '0');
		return `PVC-${timestamp.slice(-8)}-${randomNum}`;
	}

	async function handleMintProduct() {
		if (!isFormValid) return;

		try {
			minting = true;
			error = '';
			success = '';

			let imageHash = '';

			// Upload image if selected
			if (selectedImage) {
				uploadingImage = true;
				imageUploadProgress = 0;

				try {
					imageHash = await uploadImageToPinata(
						selectedImage,
						(progress) => {
							imageUploadProgress = progress;
						},
						productForm.id,
						productForm.id // Use product ID as manufacturer identifier for now
					);

					console.log('✅ Image uploaded successfully:', imageHash);
					success = 'Image uploaded successfully! Now minting product...';
				} catch (imageError) {
					console.error('❌ Image upload failed:', imageError);
					error = `Image upload failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`;
					return;
				} finally {
					uploadingImage = false;
					imageUploadProgress = 0;
				}
			}

			const result = await mintProduct({
				id: productForm.id,
				name: productForm.name,
				batch: productForm.batch,
				quantity: productForm.quantity,
				description: productForm.description,
				category: productForm.category,
				image: imageHash,
				ascConfig: {
					enableQualityMonitoring: productForm.enableQualityMonitoring,
					temperatureThreshold: productForm.temperatureThreshold,
					humidityThreshold: productForm.humidityThreshold,
					enablePaymentAutomation: productForm.enablePaymentAutomation,
					paymentConditions: productForm.paymentConditions,
					enableInsurance: productForm.enableInsurance,
					insuranceValue: productForm.insuranceValue
				}
			});

			if (result.success) {
				success = `Product minted successfully! Operation ID: ${result.operationId}`;
				totalProducts += 1;

				setTimeout(() => {
					goto(`/product/${result.productId}?minted=true`);
				}, 2000);

				productForm = {
					id: generateProductId(),
					name: '',
					batch: '',
					quantity: 1,
					description: '',
					category: '',
					image: '',
					enableQualityMonitoring: true,
					temperatureThreshold: '25',
					humidityThreshold: '70',
					enablePaymentAutomation: false,
					paymentConditions: 'delivery_confirmation',
					enableInsurance: false,
					insuranceValue: ''
				};

				// Clear image states
				selectedImage = null;
				imagePreview = '';
				uploadingImage = false;
			} else {
				error = result.error || 'Failed to mint product';
			}
		} catch (err) {
			error = 'Minting failed: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			minting = false;
		}
	}

	function resetForm() {
		productForm = {
			id: generateProductId(),
			name: '',
			batch: '',
			quantity: 1,
			description: '',
			category: '',
			image: '',
			enableQualityMonitoring: true,
			temperatureThreshold: '25',
			humidityThreshold: '70',
			enablePaymentAutomation: false,
			paymentConditions: 'delivery_confirmation',
			enableInsurance: false,
			insuranceValue: ''
		};
		// Clear image states
		selectedImage = null;
		imagePreview = '';
		uploadingImage = false;
		error = '';
		success = '';
	}

	// Handle image selection and preview
	function handleImageSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Please select a valid image file (JPG, PNG, GIF)';
			return;
		}

		// Validate file size (5MB limit)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Image file must be less than 5MB';
			return;
		}

		selectedImage = file;
		error = '';

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			imagePreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	// Clear selected image
	function clearImage() {
		selectedImage = null;
		imagePreview = '';
		productForm.image = '';

		// Clear file input
		const fileInput = document.getElementById('product-image') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Load pending product requests
	async function loadPendingRequests() {
		try {
			pendingRequests = await getPendingRequests(userAddress);
		} catch (err) {
			console.error('Failed to load pending requests:', err);
		}
	}

	// Debug blockchain state
	async function handleDebugBlockchain() {
		try {
			console.log('🔍 DEBUG: Checking blockchain state...');
			const result = await debugAllRequestsForManufacturer(userAddress);
			console.log('🔍 DEBUG RESULT:', result);

			// Also debug the first pending request if any
			if (pendingRequests.length > 0) {
				const firstRequest = pendingRequests[0];
				console.log('🔍 Debugging first request:', firstRequest.id);
				const requestDetails = await debugRequestStatus(firstRequest.id);
				console.log('🔍 Request details from blockchain:', requestDetails);
			}
		} catch (error) {
			console.error('❌ Debug failed:', error);
		}
	}

	// Test approval workflow on first pending request
	async function handleTestApproval() {
		if (pendingRequests.length === 0) {
			console.log('❌ No pending requests to test approval on');
			return;
		}

		const firstRequest = pendingRequests[0];
		console.log('🧪 Testing approval workflow on request:', firstRequest.id);

		try {
			const result = await debugApprovalWorkflow(firstRequest.id);
			console.log('🧪 Approval workflow result:', result);

			if (result.success) {
				success = `Test approval successful! Operation: ${result.operationId}`;
				// Refresh pending requests
				await loadPendingRequests();
			} else {
				error = `Test approval failed: ${result.error}`;
			}
		} catch (testError) {
			console.error('❌ Test approval failed:', testError);
			error = 'Test approval failed: ' + testError;
		}
	}

	// Debug contract state
	async function handleDebugContract() {
		try {
			console.log('🔍 DEBUG: Checking contract state...');
			const result = await debugContractState();
			console.log('🔍 CONTRACT DEBUG RESULT:', result);
		} catch (error) {
			console.error('❌ Contract debug failed:', error);
		}
	}

	// Test smart contract directly
	async function handleTestContractDirect() {
		if (pendingRequests.length === 0) {
			console.log('❌ No pending requests to test');
			return;
		}

		const firstRequest = pendingRequests[0];
		console.log('🔧 Testing smart contract directly on request:', firstRequest.id);

		try {
			const result = await testSmartContractDirectly(firstRequest.id);
			console.log('🔧 Direct contract test result:', result);

			if (result.success) {
				success = `Direct contract test successful! Operation: ${result.operationId}`;
				await loadPendingRequests();
			} else {
				error = `Direct contract test failed: ${result.error}`;
			}
		} catch (testError) {
			console.error('❌ Direct contract test failed:', testError);
			error = 'Direct contract test failed: ' + testError;
		}
	}

	// Debug request storage
	async function handleDebugStorage() {
		if (pendingRequests.length === 0) {
			console.log('❌ No pending requests to debug storage');
			return;
		}

		const firstRequest = pendingRequests[0];
		console.log('📖 Debugging storage for request:', firstRequest.id);

		try {
			const result = await debugRequestStorage(firstRequest.id);
			console.log('📖 Storage debug result:', result);
		} catch (error) {
			console.error('❌ Storage debug failed:', error);
		}
	}

	// Check network status
	async function handleCheckNetwork() {
		try {
			console.log('🌐 Checking Massa network status...');
			const result = await checkMassaNetworkStatus();
			console.log('🌐 Network status result:', result);
		} catch (error) {
			console.error('❌ Network check failed:', error);
		}
	}

	// Retry approval with higher fee
	async function handleRetryWithHigherFee() {
		if (pendingRequests.length === 0) {
			console.log('❌ No pending requests to retry');
			return;
		}

		const firstRequest = pendingRequests[0];
		console.log('🔄 Retrying approval with higher fee for request:', firstRequest.id);

		try {
			const result = await retryApprovalWithBetterFee(firstRequest.id);
			console.log('🔄 Retry result:', result);

			if (result.success) {
				success = `Retry successful! Check operation: ${result.operationId}`;
				console.log('🔗 Massa Explorer:', result.explorerUrl);
			} else {
				error = `Retry failed: ${result.error}`;
			}
		} catch (retryError) {
			console.error('❌ Retry failed:', retryError);
			error = 'Retry failed: ' + retryError;
		}
	}

	let dashboardStats = $derived([
		{ label: 'Products', value: totalProducts.toString(), icon: '📦' },
		{ label: 'Pending Requests', value: pendingRequests.length.toString(), icon: '📋' }
	]);
</script>

<RouteGuard requiredRole="manufacturer">
	<PageLayout
		title="Manufacturer Dashboard"
		subtitle="Mint and manage your products on the blockchain"
	>
		<div class="manufacturer-dashboard">
			{#if loading}
				<div class="flex items-center justify-center py-16">
					<div class="text-center">
						<div
							class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-400"
						></div>
						<div class="text-lg text-green-400">Loading manufacturer dashboard...</div>
					</div>
				</div>
			{:else}
				<!-- Dashboard Stats -->
				<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each dashboardStats as stat}
						{#if stat.label === 'Pending Requests'}
							<button
								onclick={() => goto('/manufacturer/requests')}
								class="text-left {stat.label === 'Pending Requests'
									? 'cursor-pointer transition-opacity hover:opacity-90'
									: ''}"
							>
								<Card
									title={stat.label}
									class="border-gray-700 bg-gray-800 transition-colors hover:border-blue-500/50"
								>
									<div class="flex items-center justify-between">
										<div>
											<p class="text-3xl font-bold text-white">{stat.value}</p>
											<p class="text-sm text-gray-400">{stat.label}</p>
										</div>
										<div class="text-4xl">{stat.icon}</div>
									</div>
									{#if parseInt(stat.value) > 0}
										<div class="mt-2">
											<p class="text-xs text-blue-400">Click to manage →</p>
										</div>
									{/if}
								</Card>
							</button>
						{:else}
							<Card title={stat.label} class="border-gray-700 bg-gray-800">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-3xl font-bold text-white">{stat.value}</p>
										<p class="text-sm text-gray-400">{stat.label}</p>
									</div>
									<div class="text-4xl">{stat.icon}</div>
								</div>
							</Card>
						{/if}
					{/each}

					<!-- Quick Actions -->
					<Card title="Quick Actions" class="border-gray-700 bg-gray-800">
						<div class="space-y-3">
							<Button
								onclick={() => goto('/manufacturer/products')}
								class="w-full bg-blue-600 hover:bg-blue-700"
							>
								View Products
							</Button>
							<Button
								onclick={() => goto('/manufacturer/launchpad')}
								class="w-full bg-purple-600 hover:bg-purple-700"
							>
								Launchpad
							</Button>
							<!-- <Button onclick={handleDebugBlockchain} class="w-full bg-red-600 hover:bg-red-700">
								🔍 Debug Blockchain
							</Button> -->
						</div>
					</Card>

					<!-- Debug Tools -->
					<!-- <Card title="Debug Tools" class="bg-gray-800 border-gray-700">
						<div class="space-y-3">
							<Button onclick={handleTestApproval} class="w-full bg-orange-600 hover:bg-orange-700">
								🧪 Test Approval
							</Button>
							<Button onclick={handleDebugContract} class="w-full bg-yellow-600 hover:bg-yellow-700">
								📊 Contract State
							</Button>
							<Button onclick={handleTestContractDirect} class="w-full bg-purple-600 hover:bg-purple-700">
								🔧 Direct Contract Test
							</Button>
							<Button onclick={handleDebugStorage} class="w-full bg-indigo-600 hover:bg-indigo-700">
								📖 Storage Debug
							</Button>
						</div>
					</Card> -->

					<!-- Network Tools -->
					<!-- <Card title="Network Tools" class="bg-gray-800 border-gray-700">
						<div class="space-y-3">
							<Button onclick={handleCheckNetwork} class="w-full bg-green-600 hover:bg-green-700">
								🌐 Check Network
							</Button>
							<Button onclick={handleRetryWithHigherFee} class="w-full bg-red-600 hover:bg-red-700">
								🔄 Retry High Fee
							</Button>
						</div>
					</Card> -->
				</div>

				{#if error}
					<div class="mb-6 rounded-lg border border-red-500 bg-red-900/20 p-4">
						<div class="font-medium text-red-400">{error}</div>
					</div>
				{/if}

				{#if success}
					<div class="mb-6 rounded-lg border border-green-500 bg-green-900/20 p-4">
						<div class="font-medium text-green-400">{success}</div>
					</div>
				{/if}

				<!-- Product Minting Form -->
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<!-- Form Section -->
					<Card title="Mint New Product" class="border-gray-700 bg-gray-800">
						<form class="space-y-6">
							<div>
								<label for="product-id" class="mb-2 block text-sm font-medium text-green-400"
									>Product ID</label
								>
								<input
									id="product-id"
									bind:value={productForm.id}
									type="text"
									readonly
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 font-mono text-sm text-gray-300"
								/>
								<p class="mt-1 text-xs text-gray-400">Auto-generated unique identifier</p>
							</div>

							<div>
								<label for="product-name" class="mb-2 block text-sm font-medium text-green-400"
									>Product Name *</label
								>
								<input
									id="product-name"
									bind:value={productForm.name}
									type="text"
									required
									placeholder="Enter product name"
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white
										transition-colors focus:border-green-500 focus:ring-1 focus:ring-green-500"
								/>
							</div>

							<!-- Batch Number -->
							<div>
								<label for="batch-number" class="mb-2 block text-sm font-medium text-green-400"
									>Batch Number *</label
								>
								<input
									id="batch-number"
									bind:value={productForm.batch}
									type="text"
									required
									placeholder="B-2025-001"
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white
										transition-colors focus:border-green-500 focus:ring-1 focus:ring-green-500"
								/>
							</div>

							<!-- Quantity -->
							<div>
								<label for="quantity" class="mb-2 block text-sm font-medium text-green-400"
									>Quantity *</label
								>
								<input
									id="quantity"
									bind:value={productForm.quantity}
									type="number"
									required
									min="1"
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white
										transition-colors focus:border-green-500 focus:ring-1 focus:ring-green-500"
								/>
							</div>

							<!-- Category -->
							<div>
								<label for="category" class="mb-2 block text-sm font-medium text-green-400"
									>Category</label
								>
								<select
									id="category"
									bind:value={productForm.category}
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white
										transition-colors focus:border-green-500 focus:ring-1 focus:ring-green-500"
								>
									<option value="">Select category...</option>
									<option value="food">Food & Beverages</option>
									<option value="pharmaceutical">Pharmaceutical</option>
									<option value="electronics">Electronics</option>
									<option value="textile">Textile</option>
									<option value="automotive">Automotive</option>
									<option value="luxury">Luxury Goods</option>
									<option value="other">Other</option>
								</select>
							</div>

							<!-- Description -->
							<div>
								<label for="description" class="mb-2 block text-sm font-medium text-green-400"
									>Description</label
								>
								<textarea
									id="description"
									bind:value={productForm.description}
									rows="3"
									placeholder="Product description..."
									class="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2
										text-white transition-colors focus:border-green-500 focus:ring-1 focus:ring-green-500"
								></textarea>
							</div>

							<!-- Product Image -->
							<div>
								<label for="product-image" class="mb-2 block text-sm font-medium text-green-400"
									>Product Image</label
								>
								<div class="space-y-3">
									<!-- File input -->
									<input
										id="product-image"
										type="file"
										accept="image/*"
										onchange={handleImageSelect}
										class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white
											file:mr-4 file:rounded-full file:border-0 file:bg-green-600 file:px-4 file:py-2
											file:text-sm file:font-semibold file:text-white hover:file:bg-green-700"
									/>

									<!-- Image preview -->
									{#if imagePreview}
										<div class="relative">
											<img
												src={imagePreview}
												alt="Product preview"
												class="h-32 w-32 rounded-lg border border-gray-600 object-cover"
											/>
											<button
												onclick={clearImage}
												type="button"
												class="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
												aria-label="Remove selected image"
											>
												<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									{/if}

									{#if uploadingImage}
										<div class="space-y-2">
											<div class="flex items-center space-x-2 text-sm text-gray-400">
												<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													/>
													<path
														class="opacity-75"
														fill="currentColor"
														d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													/>
												</svg>
												<span>Uploading image... {imageUploadProgress}%</span>
											</div>
											{#if imageUploadProgress > 0}
												<div class="h-2 w-full rounded-full bg-gray-700">
													<div
														class="h-2 rounded-full bg-blue-600 transition-all duration-300"
														style="width: {imageUploadProgress}%"
													></div>
												</div>
											{/if}
										</div>
									{/if}
								</div>
								<p class="mt-1 text-xs text-gray-400">
									Optional: Upload a product image (JPG, PNG, GIF - Max 5MB)
								</p>
							</div>

							<div class="flex space-x-4 pt-4">
								<Button onclick={handleMintProduct} class="flex-1 bg-green-600 hover:bg-green-700">
									{#if minting}
										<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											/>
											<path
												class="opacity-75"
												fill="currentColor"
												d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										Minting...
									{:else}
										🚀 Mint Product
									{/if}
								</Button>

								<Button onclick={resetForm} class="bg-gray-600 hover:bg-gray-700">Reset</Button>
							</div>
						</form>
					</Card>

					<Card title="ASC Integration" class="border-gray-700 bg-gray-800">
						<div class="space-y-4">
							<div class="text-sm font-medium text-green-400">
								🤖 Autonomous Supply Chain Features
							</div>

							<div class="rounded-lg bg-gray-700/50 p-3">
								<label class="flex cursor-pointer items-center space-x-3">
									<input
										bind:checked={productForm.enableQualityMonitoring}
										type="checkbox"
										class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
									/>
									<div>
										<span class="text-sm font-medium text-white"
											>Enable Autonomous Quality Monitoring</span
										>
										<p class="mt-1 text-xs text-gray-400">
											Monitor temperature, humidity, and other conditions automatically using IoT
											sensors
										</p>
									</div>
								</label>
								{#if productForm.enableQualityMonitoring}
									<div class="mt-4 space-y-3">
										<div>
											<label for="temperature-threshold" class="mb-1 block text-xs text-gray-300"
												>Maximum Temperature (°C)</label
											>
											<input
												id="temperature-threshold"
												bind:value={productForm.temperatureThreshold}
												type="number"
												step="0.1"
												placeholder="25.0"
												class="w-full rounded border border-gray-500 bg-gray-600 px-3 py-2 text-sm text-white focus:border-green-500"
											/>
											<p class="mt-1 text-xs text-gray-400">
												Alert if temperature exceeds this value
											</p>
										</div>
										<div>
											<label for="humidity-threshold" class="mb-1 block text-xs text-gray-300"
												>Maximum Humidity (%)</label
											>
											<input
												id="humidity-threshold"
												bind:value={productForm.humidityThreshold}
												type="number"
												step="0.1"
												placeholder="70.0"
												class="w-full rounded border border-gray-500 bg-gray-600 px-3 py-2 text-sm text-white focus:border-green-500"
											/>
											<p class="mt-1 text-xs text-gray-400">
												Alert if humidity exceeds this percentage
											</p>
										</div>
									</div>
								{/if}
							</div>

							<div class="rounded-lg bg-gray-700/50 p-3">
								<label class="flex items-center space-x-3">
									<input
										bind:checked={productForm.enablePaymentAutomation}
										type="checkbox"
										class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
									/>
									<span class="text-sm text-white">Enable Payment Automation</span>
								</label>
								{#if productForm.enablePaymentAutomation}
									<div class="mt-3">
										<select
											bind:value={productForm.paymentConditions}
											class="w-full rounded border border-gray-500 bg-gray-600 px-2 py-1 text-sm text-white"
										>
											<option value="delivery_confirmation">On Delivery Confirmation</option>
											<option value="quality_approval">On Quality Approval</option>
											<option value="milestone_based">Milestone Based</option>
										</select>
									</div>
								{/if}
							</div>

							<div class="rounded-lg bg-gray-700/50 p-3">
								<label class="flex items-center space-x-3">
									<input
										bind:checked={productForm.enableInsurance}
										type="checkbox"
										class="h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
									/>
									<span class="text-sm text-white">Enable Smart Insurance</span>
								</label>
								{#if productForm.enableInsurance}
									<div class="mt-3">
										<input
											bind:value={productForm.insuranceValue}
											type="text"
											placeholder="Insurance value (MAS)"
											class="w-full rounded border border-gray-500 bg-gray-600 px-2 py-1 text-sm text-white"
										/>
									</div>
								{/if}
							</div>

							<div class="mt-8 rounded-lg bg-gray-700/50 p-4">
								<h3 class="mb-2 font-medium text-white">🤖 ASC Features</h3>
								<ul class="space-y-1 text-sm text-gray-400">
									<li>• Autonomous quality monitoring with IoT sensors</li>
									<li>• Conditional payment automation via escrow</li>
									<li>• Smart insurance with automated claims</li>
									<li>• Immutable product provenance on Massa blockchain</li>
									<li>• IPFS metadata storage via Pinata</li>
								</ul>
							</div>
						</div>
					</Card>
				</div>
			{/if}
		</div>
	</PageLayout>
</RouteGuard>
