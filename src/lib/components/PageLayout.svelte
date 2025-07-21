<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		children: Snippet;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl';
		noPadding?: boolean;
	}

	let { title, subtitle, children, maxWidth = '7xl', noPadding = false }: Props = $props();

	const containerClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md', 
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		'7xl': 'max-w-7xl'
	};
</script>

<div class="min-h-screen bg-black">
	<div class="mx-auto {containerClasses[maxWidth]} {noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-8'}">
		<div class="mb-8">
			<h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
				{title}
			</h1>
			{#if subtitle}
				<p class="mt-2 text-gray-400 text-lg">
					{subtitle}
				</p>
			{/if}
		</div>
		
		{@render children()}
	</div>
</div>
