<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import {
		Trophy,
		Crosshair,
		Search,
		Clock,
		Lightbulb,
		ChevronLeft,
		ChevronRight,
		Loader2
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	// ─── Types ─────────────────────────────────────────
	interface LeaderboardEntry {
		rank: number;
		scoreId: string;
		userId: string;
		username: string;
		avatar: string;
		score: number;
		timeSeconds: number;
		hintsUsed: number;
		difficulty: string;
		mode: string;
		puzzleDate: string;
		createdAt: string;
	}

	interface Props {
		data: {
			user: { id: string; username: string } | null;
		};
	}

	let { data }: Props = $props();

	// ─── Filter state ──────────────────────────────────
	let gameType = $state<'crossword' | 'wordsearch'>('crossword');
	let difficulty = $state<string>('');
	let mode = $state<string>('');
	let period = $state<'today' | 'week' | 'month' | 'all'>('all');
	let page = $state(1);

	// ─── Data state ────────────────────────────────────
	let entries = $state<LeaderboardEntry[]>([]);
	let totalPages = $state(0);
	let totalItems = $state(0);
	let isLoading = $state(false);
	let hasError = $state(false);

	// ─── Config ────────────────────────────────────────
	const gameTypes = [
		{
			key: 'crossword' as const,
			label: () => m.features_crossword_title(),
			icon: Crosshair,
			color: 'text-accent'
		},
		{
			key: 'wordsearch' as const,
			label: () => m.features_wordsearch_title(),
			icon: Search,
			color: 'text-accent-tertiary'
		}
	];

	const difficulties = [
		{ key: '', label: () => m.leaderboard_todas() },
		{ key: 'easy', label: () => m.cruzadas_facil() },
		{ key: 'medium', label: () => m.cruzadas_medio() },
		{ key: 'hard', label: () => m.cruzadas_dificil() }
	];

	const periods = [
		{ key: 'today' as const, label: () => m.leaderboard_periodo_hoje() },
		{ key: 'week' as const, label: () => m.leaderboard_periodo_semana() },
		{ key: 'month' as const, label: () => m.leaderboard_periodo_mes() },
		{ key: 'all' as const, label: () => m.leaderboard_periodo_todos() }
	];

	const modes = [
		{ key: '', label: () => m.leaderboard_modo_todos() },
		{ key: 'daily', label: () => m.leaderboard_modo_diario() },
		{ key: 'random', label: () => m.leaderboard_modo_aleatorio() }
	];

	// ─── Fetch ─────────────────────────────────────────

	onMount(() => {
		fetchLeaderboard();
	});

	async function fetchLeaderboard() {
		isLoading = true;
		hasError = false;

		try {
			const params = new URLSearchParams();
			params.set('gameType', gameType);
			if (difficulty) params.set('difficulty', difficulty);
			if (mode) params.set('mode', mode);
			params.set('period', period);
			params.set('page', String(page));
			params.set('perPage', '20');

			const res = await fetch(`/api/leaderboard?${params.toString()}`);
			const result = await res.json();

			if (result.success) {
				entries = result.entries;
				totalPages = result.totalPages;
				totalItems = result.totalItems;
			} else {
				hasError = true;
			}
		} catch {
			hasError = true;
		} finally {
			isLoading = false;
		}
	}

	function applyFilter() {
		page = 1;
		fetchLeaderboard();
	}

	function goToPage(p: number) {
		page = p;
		fetchLeaderboard();
	}

	// ─── Helpers ───────────────────────────────────────

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}

	function formatDate(dateStr: string): string {
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
		} catch {
			return dateStr;
		}
	}

	function getRankClass(rank: number): string {
		if (rank === 1) return 'text-accent cyber-text-glow font-bold';
		if (rank === 2) return 'text-accent-tertiary font-bold';
		if (rank === 3) return 'text-accent-secondary font-bold';
		return 'text-muted-foreground';
	}

	function getRankIcon(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return String(rank);
	}

	function isCurrentUser(userId: string): boolean {
		return data.user?.id === userId;
	}
</script>

<svelte:head>
	<title>Nexo — {m.leaderboard_titulo()}</title>
</svelte:head>

<section class="relative min-h-[80vh] py-12 lg:py-20">
	<div class="cyber-grid absolute inset-0 opacity-30"></div>

	<div class="relative mx-auto max-w-5xl px-4 lg:px-8">
		<!-- Header -->
		<div class="mb-10 text-center">
			<div class="mb-4 inline-flex items-center gap-2">
				<Trophy class="h-5 w-5 text-accent" strokeWidth={1.5} />
				<Badge variant="accent" glow>{m.leaderboard_terminal()}</Badge>
			</div>

			<h1 class="mb-3 font-heading text-4xl font-bold text-foreground md:text-5xl">
				<GlitchText text={m.leaderboard_titulo()} tag="span" class="text-accent cyber-text-glow" />
			</h1>
			<p class="mx-auto max-w-lg font-body text-base tracking-wide text-muted-foreground">
				{m.leaderboard_subtitulo()}
			</p>
			<div class="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
		</div>

		<!-- Filters -->
		<Card variant="terminal" class="mb-8">
			{#snippet children()}
				<div class="space-y-4">
					<!-- Game type tabs -->
					<div>
						<span class="mb-2 block font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
							{m.leaderboard_filtro_jogo()}
						</span>
						<div class="flex gap-2">
							{#each gameTypes as gt}
								<button
									class="cyber-chamfer-sm flex cursor-pointer items-center gap-2 border px-4 py-2 font-accent text-xs uppercase tracking-wider transition-all duration-200 {gameType === gt.key
										? `border-accent bg-accent/10 ${gt.color} cyber-glow-sm`
										: 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'}"
									onclick={() => { gameType = gt.key; applyFilter(); }}
								>
									<gt.icon class="h-3.5 w-3.5" strokeWidth={1.5} />
									{gt.label()}
								</button>
							{/each}
						</div>
					</div>

					<!-- Second row: difficulty, mode, period -->
					<div class="flex flex-wrap gap-4">
						<!-- Difficulty -->
						<div>
							<span class="mb-2 block font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								{m.leaderboard_filtro_dificuldade()}
							</span>
							<div class="flex gap-1.5">
								{#each difficulties as d}
									<button
										class="cursor-pointer border px-3 py-1.5 font-accent text-[10px] uppercase tracking-wider transition-all duration-150 {difficulty === d.key
											? 'border-accent bg-accent/10 text-accent'
											: 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'}"
										onclick={() => { difficulty = d.key; applyFilter(); }}
									>
										{d.label()}
									</button>
								{/each}
							</div>
						</div>

						<!-- Mode -->
						<div>
							<span class="mb-2 block font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								{m.leaderboard_filtro_modo()}
							</span>
							<div class="flex gap-1.5">
								{#each modes as md}
									<button
										class="cursor-pointer border px-3 py-1.5 font-accent text-[10px] uppercase tracking-wider transition-all duration-150 {mode === md.key
											? 'border-accent-tertiary bg-accent-tertiary/10 text-accent-tertiary'
											: 'border-border text-muted-foreground hover:border-accent-tertiary/40 hover:text-foreground'}"
										onclick={() => { mode = md.key; applyFilter(); }}
									>
										{md.label()}
									</button>
								{/each}
							</div>
						</div>

						<!-- Period -->
						<div>
							<span class="mb-2 block font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								{m.leaderboard_filtro_periodo()}
							</span>
							<div class="flex gap-1.5">
								{#each periods as p}
									<button
										class="cursor-pointer border px-3 py-1.5 font-accent text-[10px] uppercase tracking-wider transition-all duration-150 {period === p.key
											? 'border-accent-secondary bg-accent-secondary/10 text-accent-secondary'
											: 'border-border text-muted-foreground hover:border-accent-secondary/40 hover:text-foreground'}"
										onclick={() => { period = p.key; applyFilter(); }}
									>
										{p.label()}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/snippet}
		</Card>

		<!-- Results -->
		{#if isLoading}
			<div class="space-y-2">
				{#each Array(8) as _}
					<div class="flex items-center gap-4 border border-border/30 bg-card/30 px-4 py-3">
						<div class="h-4 w-6 cyber-shimmer rounded-sm"></div>
						<div class="h-4 w-28 cyber-shimmer rounded-sm"></div>
						<div class="ml-auto h-4 w-16 cyber-shimmer rounded-sm"></div>
						<div class="h-4 w-14 cyber-shimmer rounded-sm"></div>
					</div>
				{/each}
			</div>
		{:else if hasError}
			<Card variant="terminal" class="text-center">
				{#snippet children()}
					<p class="py-8 font-body text-sm text-muted-foreground">
						{m.leaderboard_erro()}
					</p>
				{/snippet}
			</Card>
		{:else if entries.length === 0}
			<Card variant="terminal" class="text-center">
				{#snippet children()}
					<div class="space-y-3 py-12">
						<Trophy class="mx-auto h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
						<p class="font-body text-sm text-muted-foreground">
							{m.leaderboard_vazio()}
						</p>
						<p class="font-body text-xs text-muted-foreground/60">
							{m.leaderboard_vazio_desc()}
						</p>
					</div>
				{/snippet}
			</Card>
		{:else}
			<!-- Leaderboard table -->
			<div class="overflow-x-auto border border-border bg-card/50">
				<table class="w-full">
					<thead>
						<tr class="border-b border-border bg-muted/30">
							<th class="px-4 py-3 text-left font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								{m.leaderboard_posicao()}
							</th>
							<th class="px-4 py-3 text-left font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								{m.leaderboard_jogador()}
							</th>
							<th class="px-4 py-3 text-right font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
								{m.leaderboard_pontuacao()}
							</th>
							<th class="hidden px-4 py-3 text-right font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:table-cell">
								{m.leaderboard_tempo()}
							</th>
							<th class="hidden px-4 py-3 text-right font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:table-cell">
								{m.leaderboard_dicas()}
							</th>
							<th class="hidden px-4 py-3 text-right font-accent text-[10px] uppercase tracking-[0.2em] text-muted-foreground lg:table-cell">
								{m.leaderboard_data()}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each entries as entry}
							<tr class="border-b border-border/50 transition-colors duration-100 {isCurrentUser(entry.userId) ? 'bg-accent/5' : 'hover:bg-muted/20'}">
								<!-- Rank -->
								<td class="px-4 py-3">
									<span class="font-heading text-sm {getRankClass(entry.rank)}">
										{getRankIcon(entry.rank)}
									</span>
								</td>

								<!-- Player -->
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<span class="font-body text-sm {isCurrentUser(entry.userId) ? 'text-accent font-bold' : 'text-foreground'}">
											{entry.username}
										</span>
										{#if isCurrentUser(entry.userId)}
											<Badge variant="accent" class="text-[9px]">{m.leaderboard_tu()}</Badge>
										{/if}
									</div>
								</td>

								<!-- Score -->
								<td class="px-4 py-3 text-right">
									<span class="font-body text-sm font-bold tabular-nums text-accent">
										{entry.score}
									</span>
								</td>

								<!-- Time -->
								<td class="hidden px-4 py-3 text-right md:table-cell">
									<span class="inline-flex items-center gap-1 font-body text-xs tabular-nums text-muted-foreground">
										<Clock class="h-3 w-3" strokeWidth={1.5} />
										{formatTime(entry.timeSeconds)}
									</span>
								</td>

								<!-- Hints -->
								<td class="hidden px-4 py-3 text-right md:table-cell">
									<span class="inline-flex items-center gap-1 font-body text-xs tabular-nums text-muted-foreground">
										<Lightbulb class="h-3 w-3" strokeWidth={1.5} />
										{entry.hintsUsed}
									</span>
								</td>

								<!-- Date -->
								<td class="hidden px-4 py-3 text-right lg:table-cell">
									<span class="font-accent text-[10px] text-muted-foreground/60">
										{formatDate(entry.createdAt)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-4 flex items-center justify-between">
					<span class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
						{totalItems} resultados
					</span>
					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							disabled={page <= 1}
							onclick={() => goToPage(page - 1)}
						>
							<ChevronLeft class="mr-1 h-3 w-3" strokeWidth={2} />
							{m.leaderboard_pagina_anterior()}
						</Button>
						<span class="flex items-center font-accent text-xs text-muted-foreground">
							{page} / {totalPages}
						</span>
						<Button
							variant="ghost"
							size="sm"
							disabled={page >= totalPages}
							onclick={() => goToPage(page + 1)}
						>
							{m.leaderboard_pagina_seguinte()}
							<ChevronRight class="ml-1 h-3 w-3" strokeWidth={2} />
						</Button>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Back link -->
		<div class="mt-8 text-center">
			<Button variant="ghost" href="/">
				{m.comum_voltar()}
			</Button>
		</div>
	</div>
</section>
