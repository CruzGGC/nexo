<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { TicTacToeState } from '$lib/games/tictactoe/types';
	import { WINNING_LINES } from '$lib/games/tictactoe/types';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface Props {
		state: TicTacToeState;
		userId: string;
		isMyTurn: boolean;
		onMove: (cell: number) => void;
		disabled?: boolean;
	}

	let { state, userId, isMyTurn, onMove, disabled = false }: Props = $props();

	let mySymbol = $derived(state.symbols[userId] ?? 'X');
	let opponentSymbol = $derived(mySymbol === 'X' ? 'O' : 'X');

	// Determine winning cells for highlight
	let winningCells = $derived.by(() => {
		for (const [a, b, c] of WINNING_LINES) {
			const cellA = state.board[a];
			if (cellA !== null && cellA === state.board[b] && cellA === state.board[c]) {
				return new Set([a, b, c]);
			}
		}
		return new Set<number>();
	});

	let isFinished = $derived(winningCells.size > 0 || state.moveCount >= 9);

	function handleCellClick(index: number) {
		if (disabled || !isMyTurn || isFinished) return;
		if (state.board[index] !== null) return;
		onMove(index);
	}

	function getSymbolForCell(cell: string | null): string {
		if (cell === null) return '';
		return state.symbols[cell] ?? '?';
	}

	function getCellColor(cell: string | null, index: number): string {
		if (cell === null) return '';
		const isWinCell = winningCells.has(index);
		if (cell === userId) {
			return isWinCell ? 'text-accent cyber-text-glow' : 'text-accent';
		}
		return isWinCell ? 'text-accent-secondary cyber-text-glow' : 'text-accent-secondary';
	}
</script>

<div class="space-y-4">
	<!-- Turn / symbol indicator -->
	<div class="flex items-center justify-center gap-3">
		<Badge variant={mySymbol === 'X' ? 'accent' : 'secondary'}>
			{m.galo_jogas_com()} {mySymbol}
		</Badge>
		{#if !isFinished}
			{#if isMyTurn}
				<Badge variant="accent" glow>
					{m.galo_tua_vez()}
				</Badge>
			{:else}
				<Badge variant="muted">
					{m.galo_vez_adversario()}
				</Badge>
			{/if}
		{/if}
	</div>

	<!-- 3×3 Grid -->
	<div class="mx-auto w-fit">
		<div class="grid grid-cols-3 gap-1.5">
			{#each state.board as cell, i}
				{@const symbol = getSymbolForCell(cell)}
				{@const colorClass = getCellColor(cell, i)}
				{@const isWinCell = winningCells.has(i)}
				{@const isEmpty = cell === null}
				{@const canClick = isEmpty && isMyTurn && !isFinished && !disabled}
				<button
					class="relative flex h-20 w-20 items-center justify-center border transition-all duration-150 sm:h-24 sm:w-24
						{isWinCell
							? 'border-accent bg-accent/10'
							: isEmpty
								? 'border-border/50 bg-card/30'
								: 'border-border bg-card/50'}
						{canClick ? 'cursor-pointer hover:border-accent/60 hover:bg-accent/5' : ''}
						{!canClick && isEmpty ? 'cursor-default' : ''}"
					disabled={!canClick}
					onclick={() => handleCellClick(i)}
					aria-label={isEmpty ? m.galo_celula_vazia() : symbol}
				>
					{#if symbol}
						<span
							class="font-heading text-3xl font-black cyber-pop sm:text-4xl {colorClass}
								{isWinCell ? 'animate-pulse' : ''}"
						>
							{symbol}
						</span>
					{:else if canClick}
						<!-- Hover ghost symbol -->
						<span class="font-heading text-3xl font-black text-accent/0 transition-colors duration-100 hover-parent-text sm:text-4xl group-hover:text-accent/20">
							{mySymbol}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>
