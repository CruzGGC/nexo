<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { CrosswordClueClient, Direction } from '$lib/games/crossword/types';

	interface Props {
		entries: CrosswordClueClient[];
		activeClueNumber: number | null;
		currentDirection: Direction;
		onClueSelect: (number: number, direction: Direction) => void;
		class?: string;
	}

	let {
		entries,
		activeClueNumber,
		currentDirection,
		onClueSelect,
		class: className = ''
	}: Props = $props();

	let acrossClues = $derived(
		entries
			.filter((e) => e.direction === 'across')
			.sort((a, b) => a.number - b.number)
	);

	let downClues = $derived(
		entries
			.filter((e) => e.direction === 'down')
			.sort((a, b) => a.number - b.number)
	);

	function isActive(number: number, direction: Direction): boolean {
		return activeClueNumber === number && currentDirection === direction;
	}
</script>

<div class="flex flex-col gap-6 {className}">
	<!-- Across clues -->
	<div>
		<h3 class="mb-3 border-b border-border pb-2 font-accent text-xs uppercase tracking-[0.2em] text-accent">
			{m.cruzadas_horizontais()}
		</h3>
		<ol class="space-y-1">
			{#each acrossClues as clue}
				<li>
					<button
						class="w-full cursor-pointer rounded-none px-2 py-1.5 text-left font-body text-xs transition-all duration-100 {isActive(clue.number, 'across')
							? 'bg-accent/10 text-accent'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
						onclick={() => onClueSelect(clue.number, 'across')}
					>
						<span class="mr-2 font-accent text-[10px] text-accent/70">{clue.number}.</span>
						{clue.clue}
					</button>
				</li>
			{/each}
		</ol>
	</div>

	<!-- Down clues -->
	<div>
		<h3 class="mb-3 border-b border-border pb-2 font-accent text-xs uppercase tracking-[0.2em] text-accent-tertiary">
			{m.cruzadas_verticais()}
		</h3>
		<ol class="space-y-1">
			{#each downClues as clue}
				<li>
					<button
						class="w-full cursor-pointer rounded-none px-2 py-1.5 text-left font-body text-xs transition-all duration-100 {isActive(clue.number, 'down')
							? 'bg-accent-tertiary/10 text-accent-tertiary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
						onclick={() => onClueSelect(clue.number, 'down')}
					>
						<span class="mr-2 font-accent text-[10px] text-accent-tertiary/70">{clue.number}.</span>
						{clue.clue}
					</button>
				</li>
			{/each}
		</ol>
	</div>
</div>
