<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		color?: 'accent' | 'secondary' | 'tertiary';
		children?: Snippet;
		class?: string;
	}

	let { color = 'accent', children, class: className = '' }: Props = $props();

	const colorMap = {
		accent: 'var(--color-accent)',
		secondary: 'var(--color-accent-secondary)',
		tertiary: 'var(--color-accent-tertiary)'
	};
</script>

<div class="neon-border relative {className}" style="--neon-color: {colorMap[color]}">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.neon-border {
		border: 1px solid var(--neon-color);
		box-shadow:
			0 0 5px var(--neon-color),
			0 0 10px color-mix(in srgb, var(--neon-color) 40%, transparent),
			inset 0 0 5px color-mix(in srgb, var(--neon-color) 10%, transparent);
	}
</style>
