<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'terminal' | 'holographic';

	interface Props {
		variant?: Variant;
		hoverEffect?: boolean;
		class?: string;
		children: Snippet;
		header?: Snippet;
	}

	let {
		variant = 'default',
		hoverEffect = false,
		class: className = '',
		children,
		header
	}: Props = $props();
</script>

{#if variant === 'terminal'}
	<div
		class="cyber-chamfer group relative border border-border bg-background transition-all duration-300 {hoverEffect
			? 'hover:-translate-y-0.5 hover:border-accent hover:cyber-glow-sm'
			: ''} {className}"
	>
		<!-- Terminal header bar -->
		<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
			<span class="h-2.5 w-2.5 rounded-full bg-destructive"></span>
			<span class="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
			<span class="h-2.5 w-2.5 rounded-full bg-accent"></span>
			{#if header}
				<span class="ml-2 font-accent text-xs uppercase tracking-widest text-muted-foreground">
					{@render header()}
				</span>
			{/if}
		</div>
		<!-- Terminal content -->
		<div class="p-5">
			{@render children()}
		</div>
	</div>
{:else if variant === 'holographic'}
	<div
		class="cyber-chamfer group relative border border-accent/30 bg-muted/30 backdrop-blur-sm transition-all duration-300 cyber-glow-sm {hoverEffect
			? 'hover:-translate-y-0.5 hover:border-accent/60 hover:cyber-glow'
			: ''} {className}"
	>
		<!-- Corner accents -->
		<div class="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-accent"></div>
		<div class="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-accent"></div>
		<div class="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-accent"></div>
		<div class="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-accent"></div>
		<!-- Content -->
		<div class="p-5">
			{@render children()}
		</div>
	</div>
{:else}
	<div
		class="cyber-chamfer group border border-border bg-card transition-all duration-300 {hoverEffect
			? 'hover:-translate-y-0.5 hover:border-accent hover:cyber-glow-sm'
			: ''} {className}"
	>
		{#if header}
			<div class="border-b border-border px-5 py-3">
				{@render header()}
			</div>
		{/if}
		<div class="p-5">
			{@render children()}
		</div>
	</div>
{/if}
