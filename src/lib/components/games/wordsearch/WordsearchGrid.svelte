<script lang="ts">
	import type { CellPosition } from '$lib/games/wordsearch/types';

	interface Props {
		grid: string[][];
		width: number;
		height: number;
		/** Currently selected cells (during drag) */
		selectionCells: CellPosition[];
		/** Cells belonging to found words (persistent highlight) */
		foundCells: Set<string>;
		/** Is game complete */
		isComplete: boolean;
		onSelectionStart: (row: number, col: number) => void;
		onSelectionMove: (row: number, col: number) => void;
		onSelectionEnd: () => void;
		class?: string;
	}

	let {
		grid,
		width,
		height,
		selectionCells,
		foundCells,
		isComplete,
		onSelectionStart,
		onSelectionMove,
		onSelectionEnd,
		class: className = ''
	}: Props = $props();

	let isDragging = $state(false);

	// Cell size calculation
	const cellSize = $derived(Math.min(38, Math.floor(580 / Math.max(width, height))));

	// Selection cell set for quick lookup
	let selectionSet = $derived(new Set(selectionCells.map((c) => `${c.row},${c.col}`)));

	function getCellClasses(row: number, col: number): string {
		const key = `${row},${col}`;
		const isSelected = selectionSet.has(key);
		const isFound = foundCells.has(key);

		let classes =
			'flex items-center justify-center font-body text-sm font-bold select-none transition-all duration-150';

		if (isSelected) {
			classes += ' bg-accent-tertiary/25 text-accent-tertiary cyber-glow-tertiary scale-110';
		} else if (isFound) {
			classes += ' bg-accent/15 text-accent cyber-text-glow';
		} else {
			classes += ' text-foreground/80';
		}

		if (isComplete) {
			classes += ' !bg-accent/10';
		}

		return classes;
	}

	function handlePointerDown(e: PointerEvent, row: number, col: number) {
		if (isComplete) return;
		e.preventDefault();
		isDragging = true;
		onSelectionStart(row, col);
		// Capture pointer for drag outside grid
		(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
	}

	function handlePointerEnter(row: number, col: number) {
		if (!isDragging || isComplete) return;
		onSelectionMove(row, col);
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;
		onSelectionEnd();
	}

	// Also handle pointer up on document (for when drag ends outside grid)
	function handleDocumentPointerUp() {
		if (isDragging) {
			isDragging = false;
			onSelectionEnd();
		}
	}
</script>

<svelte:document onpointerup={handleDocumentPointerUp} />

<div
	class="inline-block touch-none select-none border border-border bg-card/50 p-1 {className}"
	role="grid"
	aria-label="Wordsearch puzzle grid"
>
	<div
		class="inline-grid gap-0"
		style="grid-template-columns: repeat({width}, {cellSize}px); grid-template-rows: repeat({height}, {cellSize}px);"
	>
		{#each { length: height } as _, row}
			{#each { length: width } as _, col}
				<!-- svelte-ignore a11y_interactive_supports_focus -->
				<div
					class="{getCellClasses(row, col)} cursor-crosshair"
					style="width: {cellSize}px; height: {cellSize}px;"
					role="gridcell"
					aria-label="Cell {grid[row][col]}"
					onpointerdown={(e) => handlePointerDown(e, row, col)}
					onpointerenter={() => handlePointerEnter(row, col)}
					onpointerup={handlePointerUp}
				>
					{grid[row][col]}
				</div>
			{/each}
		{/each}
	</div>
</div>
