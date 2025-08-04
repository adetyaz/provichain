<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import { onMount } from 'svelte';
	import { autoReconnectWallet } from '$lib/stores/auth';

	let { children } = $props();

	onMount(() => {
		autoReconnectWallet();
	});
</script>

<div class="min-h-screen bg-black">
	<Navigation />
	<main>
		{@render children()}
	</main>
</div>
