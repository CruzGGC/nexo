<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		value?: string;
		label?: string;
		error?: string;
		class?: string;
	}

	let {
		value = $bindable(''),
		label,
		error,
		class: className = '',
		placeholder = 'introduzir comando...',
		type = 'text',
		...rest
	}: Props = $props();

	function getInputId(): string | undefined {
		return (rest.id as string | undefined) ?? (rest.name as string | undefined);
	}
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<label for={getInputId()} class="font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
			{label}
		</label>
	{/if}
	<div class="relative">
		<span
			class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-accent text-sm text-accent"
		>
			&gt;
		</span>
		<input
			id={getInputId()}
			{type}
			{placeholder}
			bind:value
			class="cyber-chamfer-sm w-full border border-border bg-input py-2.5 pl-8 pr-4 font-body text-sm text-accent placeholder:text-muted-foreground transition-all duration-200 focus:border-accent focus:cyber-glow-sm focus:outline-none {error ? 'border-destructive' : ''} {className}"
			{...rest}
		/>
	</div>
	{#if error}
		<span class="font-accent text-xs text-destructive">{error}</span>
	{/if}
</div>
