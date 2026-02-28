<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
	<!-- Background grid effect -->
	<div class="pointer-events-none fixed inset-0 cyber-grid opacity-30"></div>

	<div class="relative w-full max-w-md">
		{@render children()}
	</div>
</div>
