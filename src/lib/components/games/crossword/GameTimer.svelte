<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Clock } from 'lucide-svelte';

	interface Props {
		elapsedSeconds: number;
		isPaused: boolean;
		class?: string;
	}

	let {
		elapsedSeconds,
		isPaused,
		class: className = ''
	}: Props = $props();

	let formattedTime = $derived(() => {
		const mins = Math.floor(elapsedSeconds / 60);
		const secs = elapsedSeconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	});
</script>

<div class="inline-flex items-center gap-2 {className}">
	<Clock class="h-4 w-4 text-accent" strokeWidth={1.5} />
	<span class="font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
		{m.cruzadas_tempo()}
	</span>
	<span class="font-body text-sm tabular-nums {isPaused ? 'text-muted-foreground animate-blink' : 'text-accent cyber-text-glow'}">
		{formattedTime()}
	</span>
</div>
