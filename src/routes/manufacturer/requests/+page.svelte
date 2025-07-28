<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import RouteGuard from '$lib/components/RouteGuard.svelte';
	import { getUserAddress } from '$lib';
	import { 
		getPendingRequests, 
		getAllProductRequests, 
		approveProductRequest, 
		rejectProductRequest 
	} from '$lib/services/marketplace-service';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// State management
	let userAddress = $state('');
	let loading = $state(true);
	let error = $state('');
	let success = $state('');
	let allRequests = $state<any[]>([]);
	let processingRequest = $state<string | null>(null);
	let showRejectModal = $state(false);
	let rejectRequestId = $state('');
	let rejectReason = $state('');

	// Filter states
	let selectedFilter = $state('all');
	let searchTerm = $state('');

	onMount(async () => {
		try {
			loading = true;
			error = '';
			
			userAddress = await getUserAddress();
			
			if (!userAddress) {
				goto('/connect');
				return;
			}

			await loadAllRequests();
		} catch (err) {
			error = 'Failed to load requests: ' + (err instanceof Error ? err.message : String(err));
			console.error('Requests page error:', err);
		} finally {
			loading = false;
		}
	});

	async function loadAllRequests() {
		try {
			// Get all requests and filter for this manufacturer
			const requests = await getAllProductRequests();
			allRequests = requests.filter(req => req.manufacturerId === userAddress);
		} catch (err) {
			console.error('Failed to load requests:', err);
			error = 'Failed to load requests';
		}
	}

	// Computed values for stats
	const requestStats = $derived.by(() => {
		const total = allRequests.length;
		const pending = allRequests.filter(r => r.status === 'pending').length;
		const approved = allRequests.filter(r => r.status === 'approved').length;
		const rejected = allRequests.filter(r => r.status === 'rejected').length;

		return { total, pending, approved, rejected };
	});

	// Filtered requests based on search and filter
	const filteredRequests = $derived.by(() => {
		let filtered = allRequests;

		// Filter by status
		if (selectedFilter !== 'all') {
			filtered = filtered.filter(req => req.status === selectedFilter);
		}

		// Filter by search term
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(req => 
				req.id.toLowerCase().includes(term) ||
				req.productId.toLowerCase().includes(term) ||
				req.consumerName.toLowerCase().includes(term) ||
				(req.message && req.message.toLowerCase().includes(term))
			);
		}

		// Sort by request date (newest first)
		return filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
	});

	// Approve a product request
	async function handleApproveRequest(requestId: string) {
		try {
			processingRequest = requestId;
			const result = await approveProductRequest(requestId);
			
			if (result.success) {
				success = 'Request approved successfully!';
				if (result.nextSteps) {
					console.log('Next steps:', result.nextSteps);
				}
				await loadAllRequests(); // Refresh the list
			} else {
				error = result.error || 'Failed to approve request';
			}
		} catch (err) {
			error = 'Failed to approve request: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			processingRequest = null;
		}
	}

	// Show reject modal
	function showRejectDialog(requestId: string) {
		rejectRequestId = requestId;
		rejectReason = '';
		showRejectModal = true;
	}

	// Reject a product request with reason
	async function handleRejectRequest() {
		if (!rejectReason.trim()) {
			error = 'Please provide a reason for rejection';
			return;
		}

		try {
			processingRequest = rejectRequestId;
			const result = await rejectProductRequest(rejectRequestId, rejectReason);
			
			if (result.success) {
				success = 'Request rejected successfully!';
				await loadAllRequests(); // Refresh the list
				showRejectModal = false;
				rejectRequestId = '';
				rejectReason = '';
			} else {
				error = result.error || 'Failed to reject request';
			}
		} catch (err) {
			error = 'Failed to reject request: ' + (err instanceof Error ? err.message : String(err));
		} finally {
			processingRequest = null;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
			case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
			case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
			default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'pending': return '⏳';
			case 'approved': return '✅';
			case 'rejected': return '❌';
			default: return '📋';
		}
	}
</script>

<RouteGuard requiredRole="manufacturer">
	<PageLayout 
		title="Product Requests" 
		subtitle="Manage and respond to consumer product requests"
	>
		{#if loading}
			<div class="flex items-center justify-center py-16">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
					<div class="text-green-400 text-lg">Loading requests...</div>
				</div>
			</div>
		{:else}
			<!-- Back Button -->
			<div class="mb-6">
				<Button 
					onclick={() => goto('/manufacturer')} 
					variant="outline" 
					class="inline-flex items-center"
				>
					← Back to Dashboard
				</Button>
			</div>

			{#if error}
				<div class="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
					<div class="text-red-400 font-medium">{error}</div>
				</div>
			{/if}

			{#if success}
				<div class="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
					<div class="text-green-400 font-medium">{success}</div>
				</div>
			{/if}

			<!-- Stats Cards -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
				<Card title="Total Requests" class="bg-gray-800 border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white text-3xl font-bold">{requestStats.total}</p>
							<p class="text-gray-400 text-sm">All time</p>
						</div>
						<div class="text-4xl">📋</div>
					</div>
				</Card>
				
				<Card title="Pending" class="bg-gray-800 border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-yellow-400 text-3xl font-bold">{requestStats.pending}</p>
							<p class="text-gray-400 text-sm">Awaiting action</p>
						</div>
						<div class="text-4xl">⏳</div>
					</div>
				</Card>
				
				<Card title="Approved" class="bg-gray-800 border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-green-400 text-3xl font-bold">{requestStats.approved}</p>
							<p class="text-gray-400 text-sm">Accepted</p>
						</div>
						<div class="text-4xl">✅</div>
					</div>
				</Card>
				
				<Card title="Rejected" class="bg-gray-800 border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-red-400 text-3xl font-bold">{requestStats.rejected}</p>
							<p class="text-gray-400 text-sm">Declined</p>
						</div>
						<div class="text-4xl">❌</div>
					</div>
				</Card>
			</div>

			<!-- Filters and Search -->
			<Card title="Filter & Search" class="bg-gray-800 border-gray-700 mb-6">
				<div class="flex flex-col md:flex-row gap-4">
					<div class="flex-1">
						<input
							bind:value={searchTerm}
							type="text"
							placeholder="Search by request ID, product ID, consumer name, or message..."
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
								focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
						/>
					</div>
					<div class="md:w-48">
						<select
							bind:value={selectedFilter}
							class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
								focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
						>
							<option value="all">All Requests</option>
							<option value="pending">Pending</option>
							<option value="approved">Approved</option>
							<option value="rejected">Rejected</option>
						</select>
					</div>
				</div>
			</Card>

			<!-- Requests List -->
			<Card title="Requests ({filteredRequests.length})" class="bg-gray-800 border-gray-700">
				{#if filteredRequests.length === 0}
					<div class="text-center py-12">
						<div class="text-6xl mb-4">📭</div>
						<h3 class="text-xl font-semibold text-white mb-2">No requests found</h3>
						<p class="text-gray-400">
							{#if selectedFilter === 'all' && !searchTerm}
								No product requests have been made yet.
							{:else}
								Try adjusting your filters or search terms.
							{/if}
						</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredRequests as request}
							<div class="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-colors">
								<div class="flex justify-between items-start mb-4">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<h4 class="text-white font-medium text-lg">Request #{request.id}</h4>
											<span class="px-3 py-1 text-sm rounded-full border {getStatusColor(request.status)}">
												{getStatusIcon(request.status)} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
											</span>
										</div>
										
										<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
											<div>
												<p class="text-gray-400">Product ID</p>
												<p class="text-white font-mono">{request.productId}</p>
											</div>
											<div>
												<p class="text-gray-400">Consumer</p>
												<p class="text-white">{request.consumerName}</p>
											</div>
											<div>
												<p class="text-gray-400">Quantity</p>
												<p class="text-white">{request.quantity} units</p>
											</div>
											<div>
												<p class="text-gray-400">Requested</p>
												<p class="text-white">{new Date(request.requestedAt).toLocaleDateString()}</p>
											</div>
											{#if request.approvedAt}
												<div>
													<p class="text-gray-400">Processed</p>
													<p class="text-white">{new Date(request.approvedAt).toLocaleDateString()}</p>
												</div>
											{/if}
											{#if request.approvedBy}
												<div>
													<p class="text-gray-400">Processed by</p>
													<p class="text-white font-mono text-xs">{request.approvedBy.slice(0, 10)}...</p>
												</div>
											{/if}
										</div>
									</div>
									
									<!-- Shipping Address Section -->
									{#if request.shippingAddress}
										<div class="mt-4 p-4 bg-gray-600 rounded-lg">
											<h5 class="text-white font-medium mb-3 flex items-center">
												📦 Shipping Address
											</h5>
											<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
												<div>
													<p class="text-gray-300">Name:</p>
													<p class="text-white">{request.shippingAddress.fullName}</p>
												</div>
												{#if request.shippingAddress.phoneNumber}
													<div>
														<p class="text-gray-300">Phone:</p>
														<p class="text-white">{request.shippingAddress.phoneNumber}</p>
													</div>
												{/if}
												<div class="md:col-span-2">
													<p class="text-gray-300">Address:</p>
													<p class="text-white">
														{request.shippingAddress.addressLine1}
														{#if request.shippingAddress.addressLine2}
															<br>{request.shippingAddress.addressLine2}
														{/if}
														<br>{request.shippingAddress.city}, {request.shippingAddress.state} {request.shippingAddress.postalCode}
														<br>{request.shippingAddress.country}
													</p>
												</div>
											</div>
										</div>
									{/if}
									
									{#if request.status === 'pending'}
										<div class="flex space-x-2 ml-4">
											<Button 
												onclick={() => processingRequest !== request.id ? handleApproveRequest(request.id) : undefined}
												class="bg-green-600 hover:bg-green-700 text-sm px-4 py-2 {processingRequest === request.id ? 'opacity-50 cursor-not-allowed' : ''}"
											>
												{processingRequest === request.id ? 'Processing...' : '✅ Approve'}
											</Button>
											<Button 
												onclick={() => processingRequest !== request.id ? showRejectDialog(request.id) : undefined}
												class="bg-red-600 hover:bg-red-700 text-sm px-4 py-2 {processingRequest === request.id ? 'opacity-50 cursor-not-allowed' : ''}"
											>
												{processingRequest === request.id ? 'Processing...' : '❌ Reject'}
											</Button>
										</div>
									{/if}
								</div>
								
								{#if request.message}
									<div class="bg-gray-600 rounded-lg p-3 mt-4">
										<p class="text-gray-300 text-sm"><strong>Consumer Message:</strong></p>
										<p class="text-white text-sm mt-1">{request.message}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		{/if}

		<!-- Reject Modal -->
		{#if showRejectModal}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
					<h3 class="text-xl font-semibold text-white mb-4">Reject Request</h3>
					<p class="text-gray-400 mb-4">Please provide a reason for rejecting this request:</p>
					
					<textarea
						bind:value={rejectReason}
						placeholder="Enter rejection reason..."
						rows="4"
						class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
							focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
					></textarea>
					
					<div class="flex space-x-3 mt-6">
						<Button 
							onclick={handleRejectRequest}
							class="flex-1 bg-red-600 hover:bg-red-700"
						>
							Reject Request
						</Button>
						<Button 
							onclick={() => { showRejectModal = false; rejectRequestId = ''; rejectReason = ''; }}
							variant="outline"
							class="flex-1"
						>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</PageLayout>
</RouteGuard>
