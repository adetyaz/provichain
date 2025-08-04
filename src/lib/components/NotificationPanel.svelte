<script lang="ts">
	import { notificationService, type NotificationData } from '$lib/services/notification-service';
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let maxDisplay = 5;
	export let autoClose = true;
	export let showMarkAllAsRead = true;

	let notifications: NotificationData[] = [];
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		unsubscribe = notificationService.subscribe((newNotifications) => {
			notifications = newNotifications.slice(0, maxDisplay);
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	function handleNotificationClick(notification: NotificationData) {
		notificationService.markAsRead(notification.id);

		if (notification.actionUrl) {
			window.location.href = notification.actionUrl;
		}
	}

	function handleMarkAsRead(notification: NotificationData, event: Event) {
		event.stopPropagation();
		notificationService.markAsRead(notification.id);
	}

	function handleDelete(notification: NotificationData, event: Event) {
		event.stopPropagation();
		notificationService.deleteNotification(notification.id);
	}

	function handleMarkAllAsRead() {
		notificationService.markAllAsRead();
	}

	function getNotificationIcon(type: NotificationData['type']): string {
		switch (type) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'warning':
				return '⚠️';
			case 'quality-alert':
				return '🚨';
			case 'info':
			default:
				return 'ℹ️';
		}
	}

	function getNotificationColor(type: NotificationData['type']): string {
		switch (type) {
			case 'success':
				return 'border-green-200 bg-green-50';
			case 'error':
				return 'border-red-200 bg-red-50';
			case 'warning':
				return 'border-yellow-200 bg-yellow-50';
			case 'quality-alert':
				return 'border-red-300 bg-red-100';
			case 'info':
			default:
				return 'border-blue-200 bg-blue-50';
		}
	}

	function formatTimeAgo(date: Date): string {
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) {
			return 'Just now';
		} else if (diffInSeconds < 3600) {
			const minutes = Math.floor(diffInSeconds / 60);
			return `${minutes}m ago`;
		} else if (diffInSeconds < 86400) {
			const hours = Math.floor(diffInSeconds / 3600);
			return `${hours}h ago`;
		} else {
			const days = Math.floor(diffInSeconds / 86400);
			return `${days}d ago`;
		}
	}
</script>

<div class="notification-container space-y-3">
	<!-- Header -->
	{#if notifications.length > 0}
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-800">Notifications</h3>
			{#if showMarkAllAsRead}
				<button
					on:click={handleMarkAllAsRead}
					class="text-sm text-blue-600 transition-colors hover:text-blue-800"
				>
					Mark all as read
				</button>
			{/if}
		</div>
	{/if}

	<!-- Notifications List -->
	{#each notifications as notification (notification.id)}
		<div
			class="notification-item cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md {getNotificationColor(
				notification.type
			)} {notification.read ? 'opacity-75' : ''}"
			on:click={() => handleNotificationClick(notification)}
			in:fly={{ y: -20, duration: 300 }}
			out:fade={{ duration: 200 }}
		>
			<div class="flex items-start space-x-3">
				<!-- Icon -->
				<div class="flex-shrink-0 text-lg">
					{getNotificationIcon(notification.type)}
				</div>

				<!-- Content -->
				<div class="min-w-0 flex-1">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h4 class="text-sm font-medium text-gray-900 {notification.read ? 'opacity-75' : ''}">
								{notification.title}
							</h4>
							<p class="mt-1 text-sm text-gray-600 {notification.read ? 'opacity-75' : ''}">
								{notification.message}
							</p>
						</div>

						<!-- Actions -->
						<div class="ml-3 flex flex-shrink-0 items-center space-x-2">
							<!-- Unread indicator -->
							{#if !notification.read}
								<div class="h-2 w-2 rounded-full bg-blue-500"></div>
							{/if}

							<!-- Mark as read button -->
							{#if !notification.read}
								<button
									on:click={(e) => handleMarkAsRead(notification, e)}
									class="text-gray-400 transition-colors hover:text-gray-600"
									title="Mark as read"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</button>
							{/if}

							<!-- Delete button -->
							<button
								on:click={(e) => handleDelete(notification, e)}
								class="text-gray-400 transition-colors hover:text-red-500"
								title="Delete notification"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- Timestamp -->
					<div class="mt-2 flex items-center justify-between">
						<span class="text-xs text-gray-500">
							{formatTimeAgo(notification.timestamp)}
						</span>

						<!-- Product ID (if available) -->
						{#if notification.productId}
							<span class="font-mono text-xs text-gray-400">
								ID: {notification.productId.slice(0, 8)}...
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/each}

	<!-- Empty State -->
	{#if notifications.length === 0}
		<div class="py-8 text-center">
			<div class="mb-4 text-6xl">🔔</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">No notifications</h3>
			<p class="text-gray-500">You're all caught up! New notifications will appear here.</p>
		</div>
	{/if}
</div>

<style>
	.notification-item {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.notification-container {
		max-height: 500px;
		overflow-y: auto;
	}

	.notification-container::-webkit-scrollbar {
		width: 4px;
	}

	.notification-container::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 2px;
	}

	.notification-container::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 2px;
	}

	.notification-container::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}
</style>
