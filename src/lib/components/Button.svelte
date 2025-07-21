<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		onclick?: () => void;
		disabled?: boolean;
		loading?: boolean;
		class?: string;
	}

	let { 
		children, 
		variant = 'primary', 
		size = 'md', 
		href, 
		onclick, 
		disabled = false, 
		loading = false,
		class: className = ''
	}: Props = $props();

	const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black';
	
	const variants = {
		primary: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-green-500/25 focus:ring-green-500',
		secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 focus:ring-gray-500',
		outline: 'border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-black focus:ring-green-500',
		ghost: 'text-gray-300 hover:text-white hover:bg-white/5 focus:ring-gray-500',
		danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm rounded-md',
		md: 'px-4 py-2 text-sm rounded-lg',
		lg: 'px-6 py-3 text-base rounded-lg'
	};

	const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
</script>

{#if href}
	<a {href} class={classes}>
		{#if loading}
			<svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
			</svg>
		{/if}
		{@render children()}
	</a>
{:else}
	<button 
		{onclick} 
		{disabled}
		class={classes}
	>
		{#if loading}
			<svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
			</svg>
		{/if}
		{@render children()}
	</button>
{/if}
