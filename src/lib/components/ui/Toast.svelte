<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { toasts, dismissToast } from '$lib/stores/toast.svelte';
	import { X } from 'lucide-svelte';
</script>

{#if toasts.list.length > 0}
	<div class="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts.list as toast (toast.id)}
			<div
				class="pointer-events-auto flex max-w-sm items-center gap-3 border px-4 py-3 font-body text-sm shadow-lg backdrop-blur-sm
					{toast.type === 'success' ? 'border-accent/40 bg-card/95 text-accent' : ''}
					{toast.type === 'error' ? 'border-destructive/40 bg-card/95 text-destructive' : ''}
					{toast.type === 'info' ? 'border-accent-tertiary/40 bg-card/95 text-accent-tertiary' : ''}"
				in:fly={{ x: 80, duration: 250 }}
				out:fade={{ duration: 150 }}
			>
				<!-- Icon -->
				<span class="flex-shrink-0 font-accent text-xs uppercase tracking-wider">
					{#if toast.type === 'success'}
						[OK]
					{:else if toast.type === 'error'}
						[ERR]
					{:else}
						[INFO]
					{/if}
				</span>

				<!-- Message -->
				<span class="flex-1 text-foreground">{toast.message}</span>

				<!-- Dismiss -->
				<button
					class="flex-shrink-0 text-muted-foreground transition-colors duration-100 hover:text-foreground"
					onclick={() => dismissToast(toast.id)}
					aria-label="Fechar"
				>
					<X class="h-3.5 w-3.5" strokeWidth={2} />
				</button>
			</div>
		{/each}
	</div>
{/if}
