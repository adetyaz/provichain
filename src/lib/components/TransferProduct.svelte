<script lang="ts">
	import { ownershipService, type TransferRequest } from '$lib/services/ownership-service';
	import { getUserAddress } from '$lib/provider/provider';
	import { createEventDispatcher } from 'svelte';
	import type { Product } from '$lib/types';

	export let product: Product;
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let transferForm: TransferRequest = {
		productId: product.id,
		fromAddress: '',
		toAddress: '',
		transferType: 'gift',
		price: 0,
		notes: ''
	};

	let isLoading = false;
	let errors: string[] = [];
	let transferFee = 0;

	// Initialize form with user address
	getUserAddress().then((address) => {
		transferForm.fromAddress = address;
		calculateFee();
	});

	function calculateFee() {
		transferFee = ownershipService.calculateTransferFee(
			transferForm.transferType,
			transferForm.price
		);
	}

	function handleTransferTypeChange() {
		calculateFee();
		if (transferForm.transferType !== 'purchase') {
			transferForm.price = 0;
		}
	}

	async function handleTransfer() {
		try {
			isLoading = true;
			errors = [];

			// Validate form
			const validation = ownershipService.validateTransferRequest(transferForm);
			if (!validation.valid) {
				errors = validation.errors;
				return;
			}

			// Initiate transfer
			const transactionId = await ownershipService.initiateTransfer(transferForm);

			if (transactionId) {
				dispatch('transfer-initiated', {
					transactionId,
					product: product,
					toAddress: transferForm.toAddress,
					transferType: transferForm.transferType
				});
				closeModal();
			}
		} catch (error) {
			console.error('Transfer failed:', error);
			errors = [error instanceof Error ? error.message : 'Transfer failed'];
		} finally {
			isLoading = false;
		}
	}

	function closeModal() {
		isOpen = false;
		// Reset form
		transferForm = {
			productId: product.id,
			fromAddress: transferForm.fromAddress,
			toAddress: '',
			transferType: 'gift',
			price: 0,
			notes: ''
		};
		errors = [];
	}
</script>

{#if isOpen}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl">
			<div class="p-6">
				<!-- Header -->
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-800">Transfer Product</h2>
					<button on:click={closeModal} class="text-gray-400 transition-colors hover:text-gray-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Product Info -->
				<div class="mb-6 rounded-lg bg-gray-50 p-4">
					<div class="flex items-center space-x-3">
						{#if product.image}
							<img
								src={product.image}
								alt={product.name}
								class="h-12 w-12 rounded-lg object-cover"
							/>
						{:else}
							<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
								<svg
									class="h-6 w-6 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
									/>
								</svg>
							</div>
						{/if}
						<div>
							<h3 class="font-medium text-gray-800">{product.name}</h3>
							<p class="text-sm text-gray-600">ID: {product.id}</p>
						</div>
					</div>
				</div>

				<!-- Transfer Form -->
				<form on:submit|preventDefault={handleTransfer} class="space-y-4">
					<!-- Transfer Type -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">Transfer Type</label>
						<select
							bind:value={transferForm.transferType}
							on:change={handleTransferTypeChange}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							required
						>
							<option value="gift">Gift</option>
							<option value="purchase">Purchase</option>
							<option value="return">Return</option>
							<option value="warranty">Warranty Transfer</option>
						</select>
					</div>

					<!-- Recipient Address -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">Recipient Address</label>
						<input
							type="text"
							bind:value={transferForm.toAddress}
							placeholder="AS1..."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							required
						/>
					</div>

					<!-- Price (for purchases) -->
					{#if transferForm.transferType === 'purchase'}
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700">Price (MAS)</label>
							<input
								type="number"
								bind:value={transferForm.price}
								on:input={calculateFee}
								min="0"
								step="0.01"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								required
							/>
						</div>
					{/if}

					<!-- Notes -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">Notes (Optional)</label>
						<textarea
							bind:value={transferForm.notes}
							placeholder="Add any additional notes about this transfer..."
							rows="3"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>

					<!-- Transfer Fee Display -->
					<div class="rounded-lg bg-blue-50 p-3">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-blue-800">Transfer Fee:</span>
							<span class="text-sm font-bold text-blue-900">{transferFee.toFixed(4)} MAS</span>
						</div>
						{#if transferForm.transferType === 'warranty'}
							<p class="mt-1 text-xs text-blue-600">No fee for warranty transfers</p>
						{:else if transferForm.transferType === 'return'}
							<p class="mt-1 text-xs text-blue-600">50% discount for returns</p>
						{:else if transferForm.transferType === 'purchase'}
							<p class="mt-1 text-xs text-blue-600">2.5% of purchase price + base fee</p>
						{/if}
					</div>

					<!-- Error Messages -->
					{#if errors.length > 0}
						<div class="rounded-md border border-red-200 bg-red-50 p-3">
							<div class="flex">
								<svg
									class="mt-0.5 h-5 w-5 text-red-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-red-800">Please fix the following errors:</h3>
									<ul class="mt-2 list-inside list-disc text-sm text-red-700">
										{#each errors as error}
											<li>{error}</li>
										{/each}
									</ul>
								</div>
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex space-x-3 pt-4">
						<button
							type="button"
							on:click={closeModal}
							class="flex-1 rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={isLoading}
						>
							{#if isLoading}
								<div class="flex items-center justify-center">
									<svg
										class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Processing...
								</div>
							{:else}
								Transfer Product
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar for modal */
	div::-webkit-scrollbar {
		width: 6px;
	}

	div::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	div::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
	}

	div::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}
</style>
