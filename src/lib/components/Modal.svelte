<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		children: Snippet;
		title?: string;
		subtitle?: string;
	}

	let { open, onClose, children, title, subtitle }: Props = $props();

	let modalRoot: HTMLElement | null = null;

	$effect(() => {
		if (browser) {
			modalRoot = document.getElementById('modal-root');
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if browser && modalRoot && open}
	<div 
		class="fixed inset-0 z-[9999] overflow-y-auto"
		role="dialog" 
		aria-modal="true"
		tabindex="-1"
		onkeydown={handleKeydown}
	>
		<div 
			class="fixed inset-0 bg-black/70 backdrop-blur-sm" 
			onclick={handleBackdropClick}
		></div>
		<div class="flex min-h-full items-center justify-center p-4 relative z-[10000]">
			<div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-200">
				{#if title}
					<!-- Modal Header -->
					<div class="px-6 py-4 border-b border-gray-700">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-white text-xl font-bold">{title}</h3>
								{#if subtitle}
									<p class="text-gray-400 text-sm mt-1">{subtitle}</p>
								{/if}
							</div>
							<button
								onclick={onClose}
								class="text-gray-400 hover:text-white transition-colors p-1"
								aria-label="Close modal"
							>
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				{/if}
				
				<!-- Modal Content -->
				{@render children()}
			</div>
		</div>
	</div>
{/if}
