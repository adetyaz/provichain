export interface NotificationData {
	id: string;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error' | 'quality-alert';
	timestamp: Date;
	read: boolean;
	actionUrl?: string;
	productId?: string;
	relatedData?: Record<string, unknown>;
}

export interface NotificationPreferences {
	qualityAlerts: boolean;
	transferUpdates: boolean;
	orderUpdates: boolean;
	productUpdates: boolean;
	locationUpdates: boolean;
	browserNotifications: boolean;
	emailNotifications: boolean;
}

export class NotificationService {
	private notifications: NotificationData[] = [];
	private preferences: NotificationPreferences;
	private listeners: ((notifications: NotificationData[]) => void)[] = [];

	constructor() {
		// Load preferences from localStorage
		this.preferences = this.loadPreferences();

		// Load existing notifications
		this.loadNotifications();

		// Request notification permission if not already granted
		this.requestNotificationPermission();
	}

	/**
	 * Request browser notification permission
	 */
	async requestNotificationPermission(): Promise<boolean> {
		if (!('Notification' in window)) {
			console.warn('Browser does not support notifications');
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		if (Notification.permission !== 'denied') {
			const permission = await Notification.requestPermission();
			return permission === 'granted';
		}

		return false;
	}

	/**
	 * Show browser notification
	 */
	private async showBrowserNotification(notification: NotificationData): Promise<void> {
		if (!this.preferences.browserNotifications) {
			return;
		}

		const hasPermission = await this.requestNotificationPermission();
		if (!hasPermission) {
			return;
		}

		try {
			const browserNotification = new Notification(notification.title, {
				body: notification.message,
				icon: '/favicon.svg',
				badge: '/favicon.svg',
				tag: notification.id,
				requireInteraction: notification.type === 'error' || notification.type === 'quality-alert'
			});

			// Handle notification click
			browserNotification.onclick = () => {
				if (notification.actionUrl) {
					window.open(notification.actionUrl, '_blank');
				}
				browserNotification.close();
				this.markAsRead(notification.id);
			};

			// Auto close after 5 seconds (except for critical notifications)
			if (notification.type !== 'error' && notification.type !== 'quality-alert') {
				setTimeout(() => {
					browserNotification.close();
				}, 5000);
			}
		} catch (error) {
			console.error('Failed to show browser notification:', error);
		}
	}

	/**
	 * Add a new notification
	 */
	addNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): void {
		const newNotification: NotificationData = {
			...notification,
			id: this.generateId(),
			timestamp: new Date(),
			read: false
		};

		this.notifications.unshift(newNotification);
		this.saveNotifications();
		this.notifyListeners();

		// Show browser notification
		this.showBrowserNotification(newNotification);
	}

	/**
	 * Quality alert notification
	 */
	addQualityAlert(
		productId: string,
		alertMessage: string,
		severity: 'low' | 'medium' | 'high' | 'critical'
	): void {
		if (!this.preferences.qualityAlerts) {
			return;
		}

		const icons = {
			low: '🟡',
			medium: '🟠',
			high: '🔴',
			critical: '🚨'
		};

		this.addNotification({
			title: `${icons[severity]} Quality Alert`,
			message: alertMessage,
			type: 'quality-alert',
			productId,
			actionUrl: `/product/${productId}`,
			relatedData: { severity }
		});
	}

	/**
	 * Transfer update notification
	 */
	addTransferUpdate(
		productId: string,
		status: string,
		fromAddress?: string,
		toAddress?: string
	): void {
		if (!this.preferences.transferUpdates) {
			return;
		}

		let message = '';
		let type: NotificationData['type'] = 'info';

		switch (status) {
			case 'initiated':
				message = `Product transfer initiated to ${toAddress?.slice(0, 8)}...`;
				type = 'info';
				break;
			case 'accepted':
				message = 'Product transfer has been accepted';
				type = 'success';
				break;
			case 'completed':
				message = 'Product transfer completed successfully';
				type = 'success';
				break;
			case 'cancelled':
				message = 'Product transfer was cancelled';
				type = 'warning';
				break;
			case 'failed':
				message = 'Product transfer failed';
				type = 'error';
				break;
			default:
				message = `Product transfer status: ${status}`;
		}

		this.addNotification({
			title: '🔄 Transfer Update',
			message,
			type,
			productId,
			actionUrl: `/product/${productId}`,
			relatedData: { status, fromAddress, toAddress }
		});
	}

	/**
	 * Order update notification
	 */
	addOrderUpdate(orderId: string, status: string, productName?: string): void {
		if (!this.preferences.orderUpdates) {
			return;
		}

		let message = '';
		let type: NotificationData['type'] = 'info';

		switch (status) {
			case 'approved':
				message = `Your order for ${productName || 'product'} has been approved`;
				type = 'success';
				break;
			case 'rejected':
				message = `Your order for ${productName || 'product'} was rejected`;
				type = 'warning';
				break;
			case 'shipped':
				message = `Your order for ${productName || 'product'} has been shipped`;
				type = 'info';
				break;
			case 'delivered':
				message = `Your order for ${productName || 'product'} has been delivered`;
				type = 'success';
				break;
			default:
				message = `Order status update: ${status}`;
		}

		this.addNotification({
			title: '📦 Order Update',
			message,
			type,
			actionUrl: `/consumer/orders`,
			relatedData: { orderId, status, productName }
		});
	}

	/**
	 * Product update notification
	 */
	addProductUpdate(productId: string, updateType: string, details?: string): void {
		if (!this.preferences.productUpdates) {
			return;
		}

		let message = '';
		let title = '';

		switch (updateType) {
			case 'location':
				title = '📍 Location Update';
				message = details || 'Product location has been updated';
				break;
			case 'status':
				title = '📋 Status Update';
				message = details || 'Product status has changed';
				break;
			case 'quality':
				title = '🔍 Quality Update';
				message = details || 'Product quality information updated';
				break;
			default:
				title = '📝 Product Update';
				message = details || 'Product information has been updated';
		}

		this.addNotification({
			title,
			message,
			type: 'info',
			productId,
			actionUrl: `/product/${productId}`,
			relatedData: { updateType, details }
		});
	}

	/**
	 * Get all notifications
	 */
	getNotifications(): NotificationData[] {
		return this.notifications;
	}

	/**
	 * Get unread notifications
	 */
	getUnreadNotifications(): NotificationData[] {
		return this.notifications.filter((n) => !n.read);
	}

	/**
	 * Get notifications by type
	 */
	getNotificationsByType(type: NotificationData['type']): NotificationData[] {
		return this.notifications.filter((n) => n.type === type);
	}

	/**
	 * Mark notification as read
	 */
	markAsRead(notificationId: string): void {
		const notification = this.notifications.find((n) => n.id === notificationId);
		if (notification && !notification.read) {
			notification.read = true;
			this.saveNotifications();
			this.notifyListeners();
		}
	}

	/**
	 * Mark all notifications as read
	 */
	markAllAsRead(): void {
		let hasChanges = false;
		this.notifications.forEach((n) => {
			if (!n.read) {
				n.read = true;
				hasChanges = true;
			}
		});

		if (hasChanges) {
			this.saveNotifications();
			this.notifyListeners();
		}
	}

	/**
	 * Delete notification
	 */
	deleteNotification(notificationId: string): void {
		const index = this.notifications.findIndex((n) => n.id === notificationId);
		if (index > -1) {
			this.notifications.splice(index, 1);
			this.saveNotifications();
			this.notifyListeners();
		}
	}

	/**
	 * Clear all notifications
	 */
	clearAllNotifications(): void {
		this.notifications = [];
		this.saveNotifications();
		this.notifyListeners();
	}

	/**
	 * Get notification preferences
	 */
	getPreferences(): NotificationPreferences {
		return { ...this.preferences };
	}

	/**
	 * Update notification preferences
	 */
	updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
		this.preferences = { ...this.preferences, ...newPreferences };
		this.savePreferences();
	}

	/**
	 * Subscribe to notification updates
	 */
	subscribe(callback: (notifications: NotificationData[]) => void): () => void {
		this.listeners.push(callback);
		// Immediately call with current notifications
		callback(this.notifications);

		// Return unsubscribe function
		return () => {
			const index = this.listeners.indexOf(callback);
			if (index > -1) {
				this.listeners.splice(index, 1);
			}
		};
	}

	/**
	 * Get unread count
	 */
	getUnreadCount(): number {
		return this.notifications.filter((n) => !n.read).length;
	}

	/**
	 * Private methods
	 */
	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	private notifyListeners(): void {
		this.listeners.forEach((callback) => callback(this.notifications));
	}

	private loadNotifications(): void {
		try {
			const stored = localStorage.getItem('provichain-notifications');
			if (stored) {
				const parsed = JSON.parse(stored);
				this.notifications = parsed.map((n: NotificationData & { timestamp: string }) => ({
					...n,
					timestamp: new Date(n.timestamp)
				}));
			}
		} catch (error) {
			console.error('Failed to load notifications:', error);
			this.notifications = [];
		}
	}

	private saveNotifications(): void {
		try {
			localStorage.setItem('provichain-notifications', JSON.stringify(this.notifications));
		} catch (error) {
			console.error('Failed to save notifications:', error);
		}
	}

	private loadPreferences(): NotificationPreferences {
		try {
			const stored = localStorage.getItem('provichain-notification-preferences');
			if (stored) {
				return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
			}
		} catch (error) {
			console.error('Failed to load notification preferences:', error);
		}
		return this.getDefaultPreferences();
	}

	private savePreferences(): void {
		try {
			localStorage.setItem('provichain-notification-preferences', JSON.stringify(this.preferences));
		} catch (error) {
			console.error('Failed to save notification preferences:', error);
		}
	}

	private getDefaultPreferences(): NotificationPreferences {
		return {
			qualityAlerts: true,
			transferUpdates: true,
			orderUpdates: true,
			productUpdates: true,
			locationUpdates: false,
			browserNotifications: true,
			emailNotifications: false
		};
	}
}

// Create singleton instance
export const notificationService = new NotificationService();
