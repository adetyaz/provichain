export interface NavItem {
	label: string;
	href: string;
	icon: string;
	roles?: string[];
	children?: NavItem[];
}

export const navigationItems: NavItem[] = [
	{
		label: 'Home',
		href: '/',
		icon: 'home'
	},
	{
		label: 'Verify Product',
		href: '/scan',
		icon: 'scan'
	},
	{
		label: 'Manufacturer',
		href: '/manufacturer',
		icon: 'factory',
		roles: ['manufacturer', 'admin'],
		children: [
			{ label: 'Dashboard', href: '/manufacturer', icon: 'dashboard' },
			{ label: 'Product Launchpad', href: '/manufacturer/launchpad', icon: 'rocket' },
			{ label: 'My Products', href: '/manufacturer/products', icon: 'package' },
			{ label: 'ASC Builder', href: '/manufacturer/asc-builder', icon: 'code' }
		]
	},
	{
		label: 'Logistics',
		href: '/logistics',
		icon: 'truck',
		roles: ['logistics', 'admin'],
		children: [
			{ label: 'Dashboard', href: '/logistics', icon: 'dashboard' },
			{ label: 'Shipments', href: '/logistics/shipments', icon: 'package' },
			{ label: 'Routes', href: '/logistics/routes', icon: 'map' }
		]
	},
	{
		label: 'Consumer',
		href: '/consumer',
		icon: 'user',
		roles: ['consumer', 'admin'],
		children: [
			{ label: 'Dashboard', href: '/consumer', icon: 'dashboard' },
			{ label: 'My Products', href: '/consumer/products', icon: 'package' }
		]
	},
	{
		label: 'Admin',
		href: '/admin',
		icon: 'shield',
		roles: ['admin'],
		children: [
			{ label: 'Dashboard', href: '/admin', icon: 'dashboard' },
			{ label: 'Users', href: '/admin/users', icon: 'users' },
			{ label: 'Vetting Queue', href: '/admin/vetting', icon: 'clipboard' }
		]
	},
	{
		label: 'Analytics',
		href: '/analytics',
		icon: 'chart',
		roles: ['manufacturer', 'logistics', 'admin']
	},
	{
		label: 'About',
		href: '/about',
		icon: 'info'
	}
];

export const getVisibleNavItems = (userRole: string | null) => {
	return navigationItems.filter((item) => !item.roles || item.roles.includes(userRole || ''));
};
