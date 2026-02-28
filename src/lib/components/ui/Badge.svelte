<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'accent' | 'secondary' | 'tertiary' | 'muted' | 'destructive';

	interface Props {
		variant?: Variant;
		glow?: boolean;
		class?: string;
		children: Snippet;
	}

	let { variant = 'accent', glow = false, class: className = '', children }: Props = $props();

	const variantClasses: Record<Variant, string> = {
		accent: 'border-accent/40 text-accent bg-accent/10',
		secondary: 'border-accent-secondary/40 text-accent-secondary bg-accent-secondary/10',
		tertiary: 'border-accent-tertiary/40 text-accent-tertiary bg-accent-tertiary/10',
		muted: 'border-border text-muted-foreground bg-muted',
		destructive: 'border-destructive/40 text-destructive bg-destructive/10'
	};

	const glowClasses: Record<Variant, string> = {
		accent: 'cyber-glow-sm',
		secondary: 'cyber-glow-secondary',
		tertiary: 'cyber-glow-tertiary',
		muted: '',
		destructive: ''
	};
</script>

<span
	class="inline-flex items-center border px-2.5 py-0.5 font-accent text-xs uppercase tracking-[0.2em] cyber-chamfer-sm {variantClasses[variant]} {glow ? glowClasses[variant] : ''} {className}"
>
	{@render children()}
</span>
