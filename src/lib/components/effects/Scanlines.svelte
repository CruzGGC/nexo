<script lang="ts">
	interface Props {
		opacity?: number;
		class?: string;
	}

	let { opacity = 0.04, class: className = '' }: Props = $props();
</script>

<div
	class="pointer-events-none fixed inset-0 z-50 {className}"
	aria-hidden="true"
	style="opacity: {opacity};"
>
	<div class="scanlines-overlay absolute inset-0"></div>
</div>

<style>
	.scanlines-overlay {
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.3) 2px,
			rgba(0, 0, 0, 0.3) 4px
		);
	}
</style>
