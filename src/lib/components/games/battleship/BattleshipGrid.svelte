<script lang="ts">
	import type { OwnCell } from '$lib/games/battleship/types';
	import { BOARD_SIZE } from '$lib/games/battleship/types';

	interface Props {
		/** 100-cell flat grid */
		grid: OwnCell[];
		/** Cells to highlight (e.g. ship preview during placement) */
		highlightCells?: Set<number>;
		/** Whether cells are clickable */
		interactive?: boolean;
		/** Callback when a cell is clicked */
		onCellClick?: (cell: number) => void;
		/** Callback when a cell is right-clicked */
		onCellRightClick?: (cell: number) => void;
		/** Label to show above the grid */
		label?: string;
		/** Whether this is the opponent's grid (fog-of-war styling) */
		isOpponent?: boolean;
		/** Set of cells that are part of sunk ships */
		sunkCells?: Set<number>;
	}

	let {
		grid,
		highlightCells = new Set(),
		interactive = false,
		onCellClick,
		onCellRightClick,
		label = '',
		isOpponent = false,
		sunkCells = new Set()
	}: Props = $props();

	const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

	function getCellClass(cell: OwnCell, index: number): string {
		const isHighlight = highlightCells.has(index);
		const isSunk = sunkCells.has(index);

		if (isSunk) return 'bg-destructive/30 border-destructive/50';
		if (cell === 'hit') return 'bg-destructive/20 border-destructive/40';
		if (cell === 'miss') return 'bg-muted/30 border-border/30';
		if (cell === 'ship' && !isOpponent) return 'bg-accent/15 border-accent/30';
		if (isHighlight) return 'bg-accent-tertiary/20 border-accent-tertiary/40';
		return 'bg-card/20 border-border/20';
	}

	function getCellContent(cell: OwnCell, index: number): string {
		const isSunk = sunkCells.has(index);
		if (isSunk) return '🔥';
		if (cell === 'hit') return '💥';
		if (cell === 'miss') return '•';
		if (cell === 'ship' && !isOpponent) return '■';
		return '';
	}

	function handleClick(index: number) {
		if (interactive && onCellClick) {
			onCellClick(index);
		}
	}

	function handleContextMenu(e: MouseEvent, index: number) {
		e.preventDefault();
		if (interactive && onCellRightClick) {
			onCellRightClick(index);
		}
	}
</script>

<div class="space-y-1">
	{#if label}
		<p class="mb-2 text-center font-accent text-xs uppercase tracking-widest text-muted-foreground">
			{label}
		</p>
	{/if}

	<div class="mx-auto w-fit">
		<!-- Column labels -->
		<div class="ml-5 grid grid-cols-10 gap-px">
			{#each colLabels as col}
				<div class="flex h-4 w-6 items-center justify-center font-accent text-[9px] text-muted-foreground sm:w-7">
					{col}
				</div>
			{/each}
		</div>

		<!-- Grid rows -->
		{#each Array(BOARD_SIZE) as _, row}
			<div class="flex gap-px">
				<!-- Row label -->
				<div class="flex h-6 w-5 items-center justify-center font-accent text-[9px] text-muted-foreground sm:h-7">
					{row + 1}
				</div>

				<!-- Cells -->
				{#each Array(BOARD_SIZE) as _, col}
					{@const index = row * BOARD_SIZE + col}
					{@const cell = grid[index]}
					{@const cellClass = getCellClass(cell, index)}
					{@const content = getCellContent(cell, index)}
					<button
						class="flex h-6 w-6 items-center justify-center border text-[10px] transition-all duration-100 sm:h-7 sm:w-7
							{cellClass}
							{cell === 'hit' || sunkCells.has(index) ? 'cyber-hit-flash' : ''}
							{interactive && cell !== 'hit' && cell !== 'miss' ? 'cursor-crosshair hover:border-accent-tertiary/60 hover:bg-accent-tertiary/10' : ''}
							{!interactive ? 'cursor-default' : ''}"
						disabled={!interactive}
						onclick={() => handleClick(index)}
						oncontextmenu={(e) => handleContextMenu(e, index)}
						aria-label="({colLabels[col]}{row + 1})"
					>
						{content}
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>
