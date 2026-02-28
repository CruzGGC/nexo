<script lang="ts">
	type Tag = 'h1' | 'h2' | 'h3' | 'span' | 'p';

	interface Props {
		text: string;
		tag?: Tag;
		class?: string;
		animated?: boolean;
	}

	let { text, tag = 'span', class: className = '', animated = true }: Props = $props();
</script>

<svelte:element this={tag} class="cyber-glitch-wrapper relative inline-block {className}" data-text={text}>
	{text}
</svelte:element>

<style>
	.cyber-glitch-wrapper {
		position: relative;
	}

	.cyber-glitch-wrapper::before,
	.cyber-glitch-wrapper::after {
		content: attr(data-text);
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.cyber-glitch-wrapper::before {
		color: var(--color-accent-secondary);
		z-index: -1;
		animation: glitchTop 3s ease-in-out infinite alternate-reverse;
		clip-path: inset(0 0 65% 0);
	}

	.cyber-glitch-wrapper::after {
		color: var(--color-accent-tertiary);
		z-index: -1;
		animation: glitchBottom 2.5s ease-in-out infinite alternate;
		clip-path: inset(65% 0 0 0);
	}

	@keyframes glitchTop {
		0%,
		90%,
		100% {
			transform: translate(0);
		}
		92% {
			transform: translate(-3px, -1px);
		}
		94% {
			transform: translate(3px, 1px);
		}
		96% {
			transform: translate(-2px, 0);
		}
		98% {
			transform: translate(2px, -1px);
		}
	}

	@keyframes glitchBottom {
		0%,
		88%,
		100% {
			transform: translate(0);
		}
		90% {
			transform: translate(2px, 1px);
		}
		93% {
			transform: translate(-3px, -1px);
		}
		95% {
			transform: translate(1px, 0);
		}
		97% {
			transform: translate(-2px, 1px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cyber-glitch-wrapper::before {
			animation: none;
			transform: translate(-2px, 0);
			opacity: 0.5;
		}

		.cyber-glitch-wrapper::after {
			animation: none;
			transform: translate(2px, 0);
			opacity: 0.5;
		}
	}
</style>
