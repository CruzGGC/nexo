<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { fade, fly } from 'svelte/transition';
	import type { CrosswordPuzzleClient, CellPosition, Direction } from '$lib/games/crossword/types';
	import CrosswordGrid from '$lib/components/games/crossword/CrosswordGrid.svelte';
	import CluePanel from '$lib/components/games/crossword/CluePanel.svelte';
	import GameTimer from '$lib/components/games/crossword/GameTimer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import {
		Crosshair,
		Lightbulb,
		RotateCcw,
		Pause,
		Play,
		Trophy,
		ArrowLeft,
		Check
	} from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		data: {
			puzzle: CrosswordPuzzleClient | null;
			error: boolean;
			mode: string;
			difficulty: string;
			solutionHash?: string;
			puzzleId?: string;
			puzzleDate?: string;
			puzzleSeed?: string;
			user?: { id: string; username: string } | null;
		};
	}

	let { data }: Props = $props();

	// ─── Game state ────────────────────────────────────
	let playerGrid = $state<string[][]>([]);
	let selectedCell = $state<CellPosition | null>(null);
	let currentDirection = $state<Direction>('across');
	let activeClueNumber = $state<number | null>(null);
	let elapsedSeconds = $state(0);
	let isComplete = $state(false);
	let isPaused = $state(false);
	let hintsUsed = $state(0);
	let showComplete = $state(false);
	let score = $state(0);
	let scoreProof = $state<string | null>(null);
	let scoreStatus = $state<'idle' | 'saving' | 'saved' | 'error' | 'login_required'>('idle');
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// ─── Initialize ────────────────────────────────────

	onMount(() => {
		if (data.puzzle) {
			initializeGame(data.puzzle);
		}
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	function initializeGame(puzzle: CrosswordPuzzleClient) {
		playerGrid = Array.from({ length: puzzle.height }, () =>
			Array(puzzle.width).fill('')
		);
		selectedCell = null;
		activeClueNumber = null;
		currentDirection = 'across';
		elapsedSeconds = 0;
		isComplete = false;
		isPaused = false;
		hintsUsed = 0;
		showComplete = false;
		score = 0;
		scoreProof = null;
		scoreStatus = 'idle';
		startTimer();
	}

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			if (!isPaused && !isComplete) {
				elapsedSeconds++;
			}
		}, 1000);
	}

	// ─── Cell selection ────────────────────────────────

	function handleCellSelect(row: number, col: number) {
		if (!data.puzzle) return;
		if (!data.puzzle.cellMap[row][col]) return;

		// If clicking the same cell, toggle direction
		if (selectedCell?.row === row && selectedCell?.col === col) {
			toggleDirection();
			return;
		}

		selectedCell = { row, col };
		updateActiveClue(row, col, currentDirection);
	}

	function updateActiveClue(row: number, col: number, direction: Direction) {
		if (!data.puzzle) return;

		// Find the clue that contains this cell in the current direction
		for (const entry of data.puzzle.entries) {
			if (entry.direction !== direction) continue;
			const dr = direction === 'down' ? 1 : 0;
			const dc = direction === 'across' ? 1 : 0;
			for (let i = 0; i < entry.length; i++) {
				if (entry.row + dr * i === row && entry.col + dc * i === col) {
					activeClueNumber = entry.number;
					return;
				}
			}
		}

		// If no match in current direction, try the other
		const otherDirection: Direction = direction === 'across' ? 'down' : 'across';
		for (const entry of data.puzzle.entries) {
			if (entry.direction !== otherDirection) continue;
			const dr = otherDirection === 'down' ? 1 : 0;
			const dc = otherDirection === 'across' ? 1 : 0;
			for (let i = 0; i < entry.length; i++) {
				if (entry.row + dr * i === row && entry.col + dc * i === col) {
					activeClueNumber = entry.number;
					currentDirection = otherDirection;
					return;
				}
			}
		}
	}

	function handleClueSelect(number: number, direction: Direction) {
		if (!data.puzzle) return;

		const entry = data.puzzle.entries.find(
			(e) => e.number === number && e.direction === direction
		);
		if (!entry) return;

		currentDirection = direction;
		activeClueNumber = number;
		selectedCell = { row: entry.row, col: entry.col };
	}

	// ─── Input handling ────────────────────────────────

	function handleCellInput(row: number, col: number, value: string) {
		if (!data.puzzle) return;
		if (isComplete) return;

		playerGrid[row][col] = value;

		// Auto-advance to next cell
		advanceToNextCell(row, col);

		// Check if puzzle is complete
		checkCompletion();
	}

	function advanceToNextCell(row: number, col: number) {
		if (!data.puzzle) return;

		const dr = currentDirection === 'down' ? 1 : 0;
		const dc = currentDirection === 'across' ? 1 : 0;
		let nextRow = row + dr;
		let nextCol = col + dc;

		if (
			nextRow >= 0 &&
			nextRow < data.puzzle.height &&
			nextCol >= 0 &&
			nextCol < data.puzzle.width &&
			data.puzzle.cellMap[nextRow][nextCol]
		) {
			selectedCell = { row: nextRow, col: nextCol };
			updateActiveClue(nextRow, nextCol, currentDirection);
		}
	}

	function handleBackspace() {
		if (!data.puzzle || !selectedCell) return;

		const { row, col } = selectedCell;

		if (playerGrid[row][col] !== '') {
			// Clear current cell
			playerGrid[row][col] = '';
		} else {
			// Move back
			const dr = currentDirection === 'down' ? -1 : 0;
			const dc = currentDirection === 'across' ? -1 : 0;
			const prevRow = row + dr;
			const prevCol = col + dc;

			if (
				prevRow >= 0 &&
				prevRow < data.puzzle.height &&
				prevCol >= 0 &&
				prevCol < data.puzzle.width &&
				data.puzzle.cellMap[prevRow][prevCol]
			) {
				selectedCell = { row: prevRow, col: prevCol };
				playerGrid[prevRow][prevCol] = '';
				updateActiveClue(prevRow, prevCol, currentDirection);
			}
		}
	}

	function handleNavigate(dr: number, dc: number) {
		if (!data.puzzle || !selectedCell) return;

		let nextRow = selectedCell.row + dr;
		let nextCol = selectedCell.col + dc;

		// Find next valid cell in direction
		while (
			nextRow >= 0 &&
			nextRow < data.puzzle.height &&
			nextCol >= 0 &&
			nextCol < data.puzzle.width
		) {
			if (data.puzzle.cellMap[nextRow][nextCol]) {
				selectedCell = { row: nextRow, col: nextCol };

				// Update direction based on arrow key
				if (dr !== 0 && dc === 0) currentDirection = 'down';
				if (dc !== 0 && dr === 0) currentDirection = 'across';

				updateActiveClue(nextRow, nextCol, currentDirection);
				return;
			}
			nextRow += dr;
			nextCol += dc;
		}
	}

	function toggleDirection() {
		currentDirection = currentDirection === 'across' ? 'down' : 'across';
		if (selectedCell) {
			updateActiveClue(selectedCell.row, selectedCell.col, currentDirection);
		}
	}

	// ─── Completion check ──────────────────────────────

	function checkCompletion() {
		if (!data.puzzle) return;

		// Check if all letter cells are filled
		for (let r = 0; r < data.puzzle.height; r++) {
			for (let c = 0; c < data.puzzle.width; c++) {
				if (data.puzzle.cellMap[r][c] && playerGrid[r][c] === '') {
					return;
				}
			}
		}

		// All filled — validate via API
		validateCompletion();
	}

	async function validateCompletion() {
		try {
			const res = await fetch('/api/crossword/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode: data.mode,
					difficulty: data.difficulty,
					playerGrid,
					elapsedSeconds,
					hintsUsed,
					puzzleId: data.puzzleId,
					puzzleDate: data.puzzleDate,
					puzzleSeed: data.puzzleSeed
				})
			});

			const result = await res.json();

			if (result.valid) {
				isComplete = true;
				score = result.score || 0;
				scoreProof = typeof result.scoreProof === 'string' ? result.scoreProof : null;
				showComplete = true;
				if (timerInterval) clearInterval(timerInterval);

				// Submit score to leaderboard
				await submitScore(score);
			}
		} catch {
			// Fail silently — player can keep playing
		}
	}

	async function submitScore(finalScore: number) {
		if (!data.user) {
			scoreStatus = 'login_required';
			return;
		}

		scoreStatus = 'saving';

		try {
			if (!scoreProof) {
				scoreStatus = 'error';
				return;
			}

			const res = await fetch('/api/scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					gameType: 'crossword',
					difficulty: data.difficulty,
					mode: data.mode,
					scoreProof,
					score: finalScore,
					timeSeconds: elapsedSeconds,
					hintsUsed,
					puzzleId: data.puzzleId || `crossword-${data.difficulty}-${Date.now().toString(36)}`,
					puzzleDate: data.puzzleDate || ''
				})
			});

			if (res.ok) {
				scoreStatus = 'saved';
			} else {
				scoreStatus = 'error';
			}
		} catch {
			scoreStatus = 'error';
		}
	}

	// ─── Actions ───────────────────────────────────────

	function handlePauseToggle() {
		isPaused = !isPaused;
	}

	function handleReset() {
		if (!data.puzzle) return;
		initializeGame(data.puzzle);
	}

	async function handleRevealLetter() {
		if (!selectedCell || !data.puzzle || isComplete) return;

		const { row, col } = selectedCell;

		try {
			const res = await fetch('/api/crossword/hint', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode: data.mode,
					difficulty: data.difficulty,
					puzzleSeed: data.puzzleSeed,
					row,
					col
				})
			});

			if (!res.ok) return;

			const result = await res.json();
			if (!result.success || typeof result.letter !== 'string') return;

			const solutionLetter = result.letter.toUpperCase();
			if (playerGrid[row][col] === solutionLetter) return;

			playerGrid[row][col] = solutionLetter;
			hintsUsed++;
			advanceToNextCell(row, col);
			checkCompletion();
		} catch {
			// Keep gameplay uninterrupted on hint API failure
		}
	}

	// ─── Active clue text ──────────────────────────────
	let activeClueText = $derived(() => {
		if (!activeClueNumber || !data.puzzle) return '';
		const entry = data.puzzle.entries.find(
			(e) => e.number === activeClueNumber && e.direction === currentDirection
		);
		return entry ? `${entry.number}. ${entry.clue}` : '';
	});

	// Format time for display in completion panel
	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>Nexo — {m.cruzadas_titulo()}</title>
</svelte:head>

{#if data.error || !data.puzzle}
	<!-- Error state -->
	<section class="flex min-h-[60vh] items-center justify-center py-12">
		<Card variant="terminal" class="max-w-md">
			{#snippet header()}
				<span class="text-destructive">ERRO</span>
			{/snippet}
			{#snippet children()}
				<div class="space-y-4 text-center">
					<p class="font-body text-sm text-muted-foreground">
						{m.cruzadas_erro_gerar()}
					</p>
					<Button variant="default" href="/games/crossword">
						{m.cruzadas_voltar()}
					</Button>
				</div>
			{/snippet}
		</Card>
	</section>
{:else}
	<section class="relative py-6 lg:py-10">
		<div class="cyber-grid absolute inset-0 opacity-20"></div>

		<div class="relative mx-auto max-w-7xl px-4 lg:px-8">
			<!-- Header bar -->
			<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<Button variant="ghost" size="sm" href="/games/crossword">
						<ArrowLeft class="mr-1 h-4 w-4" strokeWidth={2} />
						{m.cruzadas_voltar()}
					</Button>
					<Badge variant="accent" glow>
						{data.mode === 'daily' ? m.cruzadas_diario() : m.cruzadas_aleatorio()}
					</Badge>
					<Badge variant="muted">
						{data.difficulty === 'easy'
							? m.cruzadas_facil()
							: data.difficulty === 'hard'
								? m.cruzadas_dificil()
								: m.cruzadas_medio()}
					</Badge>
				</div>

				<div class="flex items-center gap-4">
					<GameTimer {elapsedSeconds} {isPaused} />

					<div class="flex items-center gap-2">
						<Lightbulb class="h-4 w-4 text-accent-secondary" strokeWidth={1.5} />
						<span class="font-accent text-xs text-muted-foreground">
							{hintsUsed} {hintsUsed === 1 ? m.cruzadas_dica_usada() : m.cruzadas_dicas_usadas()}
						</span>
					</div>
				</div>
			</div>

			<!-- Active clue bar -->
			{#if activeClueText()}
				<div class="mb-4 border border-border bg-card/80 px-4 py-2.5">
					<p class="font-body text-sm text-accent">
						<span class="mr-2 font-accent text-xs uppercase text-muted-foreground">
							{currentDirection === 'across' ? m.cruzadas_horizontais() : m.cruzadas_verticais()}
						</span>
						{activeClueText()}
					</p>
				</div>
			{/if}

			<!-- Main game layout -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Grid (2/3) -->
				<div class="flex justify-center lg:col-span-2">
					<CrosswordGrid
						puzzle={data.puzzle}
						{playerGrid}
						{selectedCell}
						{currentDirection}
						{activeClueNumber}
						{isComplete}
						onCellSelect={handleCellSelect}
						onCellInput={handleCellInput}
						onDirectionToggle={toggleDirection}
						onNavigate={handleNavigate}
						onBackspace={handleBackspace}
					/>
				</div>

				<!-- Clues panel (1/3) -->
				<div class="max-h-[600px] overflow-y-auto border border-border bg-card/50 p-4">
					<CluePanel
						entries={data.puzzle.entries}
						{activeClueNumber}
						{currentDirection}
						onClueSelect={handleClueSelect}
					/>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
				<Button variant="ghost" size="sm" onclick={handlePauseToggle}>
					{#if isPaused}
						<Play class="mr-1 h-4 w-4" strokeWidth={2} />
						{m.cruzadas_retomar()}
					{:else}
						<Pause class="mr-1 h-4 w-4" strokeWidth={2} />
						{m.cruzadas_pausar()}
					{/if}
				</Button>

				<Button variant="ghost" size="sm" onclick={handleRevealLetter} disabled={isComplete}>
					<Lightbulb class="mr-1 h-4 w-4" strokeWidth={2} />
					{m.cruzadas_revelar_letra()}
				</Button>

				<Button variant="ghost" size="sm" onclick={handleReset}>
					<RotateCcw class="mr-1 h-4 w-4" strokeWidth={2} />
					{m.cruzadas_limpar()}
				</Button>
			</div>
		</div>
	</section>

	<!-- Completion overlay -->
	{#if showComplete}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm" transition:fade={{ duration: 200 }}>
			<div in:fly={{ y: 20, duration: 300, delay: 100 }}>
			<Card variant="holographic" class="max-w-md">
				{#snippet children()}
					<div class="space-y-6 p-4 text-center">
						<div class="inline-flex h-16 w-16 items-center justify-center border-2 border-accent bg-accent/10 cyber-chamfer">
							<Trophy class="h-8 w-8 text-accent" strokeWidth={1.5} />
						</div>

						<div>
							<h2 class="font-heading text-2xl font-bold text-accent cyber-text-glow">
								<GlitchText text={m.cruzadas_completo_titulo()} tag="span" />
							</h2>
							<p class="mt-2 font-body text-sm text-muted-foreground">
								{m.cruzadas_completo_mensagem()}
							</p>
						</div>

						<div class="grid grid-cols-3 gap-4 border-t border-b border-border py-4">
							<div>
								<p class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
									{m.cruzadas_completo_tempo()}
								</p>
								<p class="mt-1 font-body text-lg font-bold text-accent">
									{formatTime(elapsedSeconds)}
								</p>
							</div>
							<div>
								<p class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
									{m.cruzadas_completo_dicas()}
								</p>
								<p class="mt-1 font-body text-lg font-bold text-accent-secondary">
									{hintsUsed}
								</p>
							</div>
							<div>
								<p class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
									{m.cruzadas_completo_pontuacao()}
								</p>
								<p class="mt-1 font-body text-lg font-bold text-accent-tertiary">
									{score}
								</p>
							</div>
						</div>

						<!-- Score submission feedback -->
						{#if scoreStatus === 'saved'}
							<p class="font-accent text-xs uppercase tracking-wider text-accent">
								{m.score_guardado()}
							</p>
						{:else if scoreStatus === 'saving'}
							<p class="font-accent text-xs uppercase tracking-wider text-muted-foreground animate-pulse">
								...
							</p>
						{:else if scoreStatus === 'error'}
							<p class="font-accent text-xs uppercase tracking-wider text-destructive">
								{m.score_erro()}
							</p>
						{:else if scoreStatus === 'login_required'}
							<p class="font-accent text-xs uppercase tracking-wider text-muted-foreground">
								{m.score_login_necessario()}
							</p>
						{/if}

						<div class="flex flex-col gap-3">
							<Button variant="glitch" href="/games/crossword">
								{m.cruzadas_novo_jogo()}
							</Button>
							<Button variant="outline" href="/leaderboard">
								{m.nav_classificacoes()}
							</Button>
							<Button variant="ghost" href="/">
								{m.comum_voltar()}
							</Button>
						</div>
					</div>
				{/snippet}
			</Card>
			</div>
		</div>
	{/if}
{/if}
