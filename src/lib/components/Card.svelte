<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		children: Snippet;
		class?: string;
	}

	let { title, description, children, class: className = '' }: Props = $props();
</script>

<div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 {className}">
	<h3 class="text-xl font-semibold text-white mb-2">{title}</h3>
	{#if description}
		<p class="text-gray-400 mb-4">{description}</p>
	{/if}
	{@render children()}
</div>
