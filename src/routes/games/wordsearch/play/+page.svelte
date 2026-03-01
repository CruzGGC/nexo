<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { fade, fly } from 'svelte/transition';
	import type {
		WordsearchPuzzleClient,
		CellPosition
	} from '$lib/games/wordsearch/types';
	import WordsearchGrid from '$lib/components/games/wordsearch/WordsearchGrid.svelte';
	import WordList from '$lib/components/games/wordsearch/WordList.svelte';
	import GameTimer from '$lib/components/games/crossword/GameTimer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import {
		Search,
		Lightbulb,
		RotateCcw,
		Pause,
		Play,
		Trophy,
		ArrowLeft
	} from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		data: {
			puzzle: WordsearchPuzzleClient | null;
			error: boolean;
			mode: string;
			difficulty: string;
			puzzleId?: string;
			puzzleDate?: string;
			puzzleSeed?: string;
			user?: { id: string; username: string } | null;
		};
	}

	let { data }: Props = $props();

	// ─── Game state ────────────────────────────────────
	let foundWords = $state<Set<string>>(new Set());
	let foundCells = $state<Set<string>>(new Set());
	let selectionCells = $state<CellPosition[]>([]);
	let selectionStart = $state<CellPosition | null>(null);
	let elapsedSeconds = $state(0);
	let isComplete = $state(false);
	let isPaused = $state(false);
	let hintsUsed = $state(0);
	let showComplete = $state(false);
	let score = $state(0);
	let scoreProof = $state<string | null>(null);
	let scoreStatus = $state<'idle' | 'saving' | 'saved' | 'error' | 'login_required'>('idle');
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// ─── Derived ───────────────────────────────────────
	let foundCount = $derived(foundWords.size);
	let totalCount = $derived(data.puzzle?.words.length ?? 0);

	// ─── Initialize ────────────────────────────────────

	onMount(() => {
		if (data.puzzle) {
			initializeGame();
		}
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	function initializeGame() {
		foundWords = new Set();
		foundCells = new Set();
		selectionCells = [];
		selectionStart = null;
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

	// ─── Selection logic ──────────────────────────────

	function handleSelectionStart(row: number, col: number) {
		selectionStart = { row, col };
		selectionCells = [{ row, col }];
	}

	function handleSelectionMove(row: number, col: number) {
		if (!selectionStart) return;

		// Compute cells in a straight line from start to current
		const cells = getCellsInLine(selectionStart, { row, col });
		selectionCells = cells;
	}

	function handleSelectionEnd() {
		if (selectionCells.length < 2 || !data.puzzle) {
			selectionCells = [];
			selectionStart = null;
			return;
		}

		// Check if selected cells form a valid word
		const selectedWord = selectionCells.map((c) => data.puzzle!.grid[c.row][c.col]).join('');
		const reversedWord = [...selectedWord].reverse().join('');

		let matchedWord: string | null = null;

		for (const w of data.puzzle.words) {
			if (w.word === selectedWord || w.word === reversedWord) {
				if (!foundWords.has(w.word)) {
					matchedWord = w.word;
					break;
				}
			}
		}

		if (matchedWord) {
			// Mark word as found
			const newFound = new Set(foundWords);
			newFound.add(matchedWord);
			foundWords = newFound;

			// Mark cells as found
			const newFoundCells = new Set(foundCells);
			for (const cell of selectionCells) {
				newFoundCells.add(`${cell.row},${cell.col}`);
			}
			foundCells = newFoundCells;

			// Check completion
			if (newFound.size >= totalCount) {
				handleCompletion();
			}
		}

		selectionCells = [];
		selectionStart = null;
	}

	/** Get cells in a straight line (horizontal, vertical, or diagonal) */
	function getCellsInLine(start: CellPosition, end: CellPosition): CellPosition[] {
		if (!data.puzzle) return [];

		const dr = Math.sign(end.row - start.row);
		const dc = Math.sign(end.col - start.col);

		// Must be a straight line (horizontal, vertical, or 45-degree diagonal)
		const rowDiff = Math.abs(end.row - start.row);
		const colDiff = Math.abs(end.col - start.col);

		if (rowDiff !== 0 && colDiff !== 0 && rowDiff !== colDiff) {
			// Not a valid straight line — snap to the closest axis
			if (rowDiff > colDiff) {
				// Snap to vertical
				return getCellsInLine(start, { row: end.row, col: start.col });
			} else {
				// Snap to horizontal
				return getCellsInLine(start, { row: start.row, col: end.col });
			}
		}

		const steps = Math.max(rowDiff, colDiff);
		const cells: CellPosition[] = [];

		for (let i = 0; i <= steps; i++) {
			const r = start.row + dr * i;
			const c = start.col + dc * i;

			if (r < 0 || r >= data.puzzle.height || c < 0 || c >= data.puzzle.width) break;
			cells.push({ row: r, col: c });
		}

		return cells;
	}

	// ─── Completion ───────────────────────────────────

	async function handleCompletion() {
		isComplete = true;
		if (timerInterval) clearInterval(timerInterval);

		try {
			const res = await fetch('/api/wordsearch/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode: data.mode,
					difficulty: data.difficulty,
					foundWords: Array.from(foundWords),
					elapsedSeconds,
					hintsUsed,
					puzzleId: data.puzzleId,
					puzzleDate: data.puzzleDate,
					puzzleSeed: data.puzzleSeed
				})
			});
			const result = await res.json();
			score = result.score || 0;
			scoreProof = typeof result.scoreProof === 'string' ? result.scoreProof : null;
		} catch {
			// Fallback score calculation
			score = calculateLocalScore();
			scoreProof = null;
		}

		showComplete = true;

		// Submit score to leaderboard
		await submitScore(score);
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
					gameType: 'wordsearch',
					difficulty: data.difficulty,
					mode: data.mode,
					scoreProof,
					score: finalScore,
					timeSeconds: elapsedSeconds,
					hintsUsed,
					puzzleId: data.puzzleId || `wordsearch-${data.difficulty}-${Date.now().toString(36)}`,
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

	function calculateLocalScore(): number {
		const base = 1000;
		const timePenalty = Math.max(0, elapsedSeconds - 60);
		const hintPenalty = hintsUsed * 75;
		return Math.max(0, base - timePenalty - hintPenalty);
	}

	// ─── Actions ──────────────────────────────────────

	function handlePauseToggle() {
		isPaused = !isPaused;
	}

	function handleReset() {
		if (!data.puzzle) return;
		initializeGame();
	}

	async function handleRevealWord() {
		if (!data.puzzle || isComplete) return;

		try {
			const res = await fetch('/api/wordsearch/hint', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode: data.mode,
					difficulty: data.difficulty,
					puzzleSeed: data.puzzleSeed,
					foundWords: Array.from(foundWords)
				})
			});

			if (!res.ok) return;

			const result = await res.json();
			if (!result.success || typeof result.word !== 'string' || !Array.isArray(result.cells)) return;

			if (foundWords.has(result.word)) return;

			const newFound = new Set(foundWords);
			newFound.add(result.word);
			foundWords = newFound;

			const newFoundCells = new Set(foundCells);
			for (const cell of result.cells as CellPosition[]) {
				newFoundCells.add(`${cell.row},${cell.col}`);
			}
			foundCells = newFoundCells;

			hintsUsed++;

			if (newFound.size >= totalCount) {
				handleCompletion();
			}
		} catch {
			// Keep gameplay uninterrupted on hint API failure
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>Nexo — {m.sopa_titulo()}</title>
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
						{m.sopa_erro_gerar()}
					</p>
					<Button variant="default" href="/games/wordsearch">
						{m.sopa_voltar()}
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
					<Button variant="ghost" size="sm" href="/games/wordsearch">
						<ArrowLeft class="mr-1 h-4 w-4" strokeWidth={2} />
						{m.sopa_voltar()}
					</Button>
					<Badge variant="tertiary" glow>
						{data.mode === 'daily' ? m.sopa_diario() : m.sopa_aleatorio()}
					</Badge>
					<Badge variant="muted">
						{data.difficulty === 'easy'
							? m.sopa_facil()
							: data.difficulty === 'hard'
								? m.sopa_dificil()
								: m.sopa_medio()}
					</Badge>
				</div>

				<div class="flex items-center gap-4">
					<GameTimer {elapsedSeconds} {isPaused} />

					<div class="flex items-center gap-2">
						<Search class="h-4 w-4 text-accent-tertiary" strokeWidth={1.5} />
						<span class="font-accent text-xs text-muted-foreground">
							{foundCount}/{totalCount} {m.sopa_encontradas()}
						</span>
					</div>

					<div class="flex items-center gap-2">
						<Lightbulb class="h-4 w-4 text-accent-secondary" strokeWidth={1.5} />
						<span class="font-accent text-xs text-muted-foreground">
							{hintsUsed} {hintsUsed === 1 ? m.sopa_dica_usada() : m.sopa_dicas_usadas()}
						</span>
					</div>
				</div>
			</div>

			<!-- Instruction -->
			<div class="mb-4 border border-border bg-card/80 px-4 py-2.5">
				<p class="font-body text-sm text-accent-tertiary">
					<span class="mr-2 font-accent text-xs uppercase text-muted-foreground">TIP</span>
					{m.sopa_instrucao()}
				</p>
			</div>

			<!-- Main game layout -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Grid (2/3) -->
				<div class="flex justify-center lg:col-span-2">
					<WordsearchGrid
						grid={data.puzzle.grid}
						width={data.puzzle.width}
						height={data.puzzle.height}
						{selectionCells}
						{foundCells}
						{isComplete}
						onSelectionStart={handleSelectionStart}
						onSelectionMove={handleSelectionMove}
						onSelectionEnd={handleSelectionEnd}
					/>
				</div>

				<!-- Word list panel (1/3) -->
				<div class="max-h-[600px] overflow-y-auto border border-border bg-card/50 p-4">
					<WordList
						words={data.puzzle.words}
						{foundWords}
					/>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
				<Button variant="ghost" size="sm" onclick={handlePauseToggle}>
					{#if isPaused}
						<Play class="mr-1 h-4 w-4" strokeWidth={2} />
						{m.sopa_retomar()}
					{:else}
						<Pause class="mr-1 h-4 w-4" strokeWidth={2} />
						{m.sopa_pausar()}
					{/if}
				</Button>

				<Button variant="ghost" size="sm" onclick={handleRevealWord} disabled={isComplete}>
					<Lightbulb class="mr-1 h-4 w-4" strokeWidth={2} />
					{m.sopa_revelar_palavra()}
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
						<div class="inline-flex h-16 w-16 items-center justify-center border-2 border-accent-tertiary bg-accent-tertiary/10 cyber-chamfer">
							<Trophy class="h-8 w-8 text-accent-tertiary" strokeWidth={1.5} />
						</div>

						<div>
							<h2 class="font-heading text-2xl font-bold text-accent-tertiary cyber-text-glow">
								<GlitchText text={m.sopa_completo_titulo()} tag="span" />
							</h2>
							<p class="mt-2 font-body text-sm text-muted-foreground">
								{m.sopa_completo_mensagem()}
							</p>
						</div>

						<div class="grid grid-cols-3 gap-4 border-t border-b border-border py-4">
							<div>
								<p class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
									{m.sopa_completo_tempo()}
								</p>
								<p class="mt-1 font-body text-lg font-bold text-accent-tertiary">
									{formatTime(elapsedSeconds)}
								</p>
							</div>
							<div>
								<p class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
									{m.sopa_completo_dicas()}
								</p>
								<p class="mt-1 font-body text-lg font-bold text-accent-secondary">
									{hintsUsed}
								</p>
							</div>
							<div>
								<p class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
									{m.sopa_completo_pontuacao()}
								</p>
								<p class="mt-1 font-body text-lg font-bold text-accent">
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
							<Button variant="glitch" href="/games/wordsearch">
								{m.sopa_novo_jogo()}
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
