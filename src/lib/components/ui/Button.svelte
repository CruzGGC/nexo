<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'glitch' | 'destructive';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		href?: string;
		disabled?: boolean;
		type?: HTMLButtonAttributes['type'];
		class?: string;
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variant = 'default',
		size = 'md',
		href,
		disabled = false,
		type = 'button',
		class: className = '',
		children,
		onclick
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-accent uppercase tracking-wider transition-all duration-150 cursor-pointer focus-visible:cyber-focus disabled:opacity-50 disabled:pointer-events-none cyber-chamfer-sm';

	const sizeClasses: Record<Size, string> = {
		sm: 'px-4 py-1.5 text-xs',
		md: 'px-6 py-2.5 text-sm',
		lg: 'px-8 py-3.5 text-base'
	};

	const variantClasses: Record<Variant, string> = {
		default:
			'border-2 border-accent text-accent bg-transparent hover:bg-accent hover:text-background hover:cyber-glow',
		secondary:
			'border-2 border-accent-secondary text-accent-secondary bg-transparent hover:bg-accent-secondary hover:text-background hover:cyber-glow-secondary',
		outline:
			'border border-border text-foreground bg-transparent hover:border-accent hover:text-accent hover:cyber-glow-sm',
		ghost: 'border-0 text-foreground bg-transparent hover:bg-accent/10 hover:text-accent',
		glitch:
			'border-0 bg-accent text-background font-bold hover:brightness-110 hover:cyber-glow-lg',
		destructive:
			'border-2 border-destructive text-destructive bg-transparent hover:bg-destructive hover:text-background'
	};

	let classes = $derived(`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`);
</script>

{#if href && !disabled}
	<a {href} class={classes} role="button">
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} class={classes} {onclick}>
		{@render children()}
	</button>
{/if}
