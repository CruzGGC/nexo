<script lang="ts">
	import type { CrosswordPuzzleClient, CellPosition, Direction } from '$lib/games/crossword/types';

	interface Props {
		puzzle: CrosswordPuzzleClient;
		playerGrid: string[][];
		selectedCell: CellPosition | null;
		currentDirection: Direction;
		activeClueNumber: number | null;
		isComplete: boolean;
		onCellSelect: (row: number, col: number) => void;
		onCellInput: (row: number, col: number, value: string) => void;
		onDirectionToggle: () => void;
		onNavigate: (dr: number, dc: number) => void;
		onBackspace: () => void;
		class?: string;
	}

	let {
		puzzle,
		playerGrid,
		selectedCell,
		currentDirection,
		activeClueNumber,
		isComplete,
		onCellSelect,
		onCellInput,
		onDirectionToggle,
		onNavigate,
		onBackspace,
		class: className = ''
	}: Props = $props();

	/** Get the entry for a cell if it's the start of the active word */
	function getHighlightedCells(): Set<string> {
		const cells = new Set<string>();
		if (!activeClueNumber) return cells;

		for (const entry of puzzle.entries) {
			if (entry.number === activeClueNumber && entry.direction === currentDirection) {
				const dr = entry.direction === 'down' ? 1 : 0;
				const dc = entry.direction === 'across' ? 1 : 0;
				for (let i = 0; i < entry.length; i++) {
					cells.add(`${entry.row + dr * i},${entry.col + dc * i}`);
				}
				break;
			}
		}

		return cells;
	}

	let highlightedCells = $derived(getHighlightedCells());

	function getCellClasses(row: number, col: number): string {
		if (!puzzle.cellMap[row][col]) return 'bg-background/80';

		const isSelected = selectedCell?.row === row && selectedCell?.col === col;
		const isHighlighted = highlightedCells.has(`${row},${col}`);
		const hasValue = playerGrid[row]?.[col] !== '';

		let classes = 'bg-card border border-border cursor-pointer transition-all duration-100';

		if (isSelected) {
			classes += ' !border-accent !bg-accent/15 cyber-glow-sm z-10';
		} else if (isHighlighted) {
			classes += ' !border-accent/40 !bg-accent/5';
		}

		if (hasValue && !isSelected) {
			classes += ' text-accent';
		}

		if (isComplete) {
			classes += ' !border-accent/60 !bg-accent/10';
		}

		return classes;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isComplete) return;
		if (!selectedCell) return;

		const { row, col } = selectedCell;

		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault();
			onBackspace();
			return;
		}

		if (e.key === 'Tab' || e.key === ' ') {
			e.preventDefault();
			onDirectionToggle();
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			onNavigate(-1, 0);
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			onNavigate(1, 0);
			return;
		}
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			onNavigate(0, -1);
			return;
		}
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			onNavigate(0, 1);
			return;
		}

		// Letter input
		if (/^[a-zA-ZÀ-ÿ]$/.test(e.key)) {
			e.preventDefault();
			onCellInput(row, col, e.key.toUpperCase());
		}
	}

	// Cell size calculation
	const cellSize = $derived(Math.min(40, Math.floor(600 / Math.max(puzzle.width, puzzle.height))));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="inline-block outline-none {className}"
	tabindex="0"
	role="grid"
	aria-label="Crossword puzzle grid"
	onkeydown={handleKeydown}
>
	<div
		class="inline-grid gap-0"
		style="grid-template-columns: repeat({puzzle.width}, {cellSize}px); grid-template-rows: repeat({puzzle.height}, {cellSize}px);"
	>
		{#each { length: puzzle.height } as _, row}
			{#each { length: puzzle.width } as _, col}
				{#if puzzle.cellMap[row][col]}
					<!-- Active cell -->
					<button
						class="relative flex items-center justify-center font-body text-sm font-bold {getCellClasses(row, col)}"
						style="width: {cellSize}px; height: {cellSize}px;"
						onclick={() => onCellSelect(row, col)}
						aria-label="Cell row {row + 1} column {col + 1}"
						disabled={isComplete}
					>
						<!-- Number label -->
						{#if puzzle.numberMap[row][col] > 0}
							<span
								class="absolute left-0.5 top-0 font-accent text-[8px] leading-none text-muted-foreground"
							>
								{puzzle.numberMap[row][col]}
							</span>
						{/if}
						<!-- Player input -->
						<span class="select-none {playerGrid[row]?.[col] ? '' : 'opacity-0'}">
							{playerGrid[row]?.[col] || '.'}
						</span>
					</button>
				{:else}
					<!-- Black cell -->
					<div
						class="bg-background/80"
						style="width: {cellSize}px; height: {cellSize}px;"
					></div>
				{/if}
			{/each}
		{/each}
	</div>
</div>
