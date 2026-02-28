<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import { Crosshair, Calendar, Shuffle, ChevronRight } from 'lucide-svelte';

	let selectedDifficulty = $state<'easy' | 'medium' | 'hard'>('medium');

	const difficulties = [
		{ key: 'easy' as const, label: () => m.cruzadas_facil(), color: 'text-accent' },
		{ key: 'medium' as const, label: () => m.cruzadas_medio(), color: 'text-accent-tertiary' },
		{ key: 'hard' as const, label: () => m.cruzadas_dificil(), color: 'text-accent-secondary' }
	];
</script>

<svelte:head>
	<title>Nexo — {m.cruzadas_titulo()}</title>
</svelte:head>

<section class="relative min-h-[80vh] py-12 lg:py-20">
	<div class="cyber-grid absolute inset-0 opacity-30"></div>

	<div class="relative mx-auto max-w-4xl px-4 lg:px-8">
		<!-- Header -->
		<div class="mb-12 text-center">
			<div class="mb-4 inline-flex items-center gap-2">
				<Crosshair class="h-5 w-5 text-accent" strokeWidth={1.5} />
				<Badge variant="accent" glow>{m.cruzadas_terminal()}</Badge>
			</div>

			<h1 class="mb-3 font-heading text-4xl font-bold text-foreground md:text-5xl">
				<GlitchText text={m.cruzadas_titulo()} tag="span" class="text-accent cyber-text-glow" />
			</h1>
			<p class="mx-auto max-w-lg font-body text-base tracking-wide text-muted-foreground">
				{m.cruzadas_subtitulo()}
			</p>
			<div class="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
		</div>

		<!-- Difficulty selector -->
		<div class="mb-8">
			<h2 class="mb-4 font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
				{m.cruzadas_dificuldade()}
			</h2>
			<div class="flex gap-3">
				{#each difficulties as diff}
					<button
						class="cyber-chamfer-sm cursor-pointer border px-5 py-2.5 font-accent text-sm uppercase tracking-wider transition-all duration-200 {selectedDifficulty === diff.key
							? `border-accent bg-accent/10 ${diff.color} cyber-glow-sm`
							: 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'}"
						onclick={() => (selectedDifficulty = diff.key)}
					>
						{diff.label()}
					</button>
				{/each}
			</div>
		</div>

		<!-- Game mode cards -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Daily puzzle -->
			<Card variant="terminal" hoverEffect class="group">
				{#snippet header()}
					<span class="text-accent">{m.cruzadas_diario()}</span>
				{/snippet}
				{#snippet children()}
					<div class="space-y-5">
						<div class="inline-flex h-14 w-14 items-center justify-center border border-accent/30 bg-accent/5 cyber-chamfer-sm transition-all duration-200 group-hover:cyber-glow-sm">
							<Calendar class="h-7 w-7 text-accent" strokeWidth={1.5} />
						</div>

						<p class="font-body text-sm leading-relaxed text-muted-foreground">
							{m.cruzadas_diario_desc()}
						</p>

						<Button variant="default" href="/games/crossword/play?mode=daily&difficulty={selectedDifficulty}">
							{m.cruzadas_jogar()}
							<ChevronRight class="ml-1 h-4 w-4" strokeWidth={2} />
						</Button>
					</div>
				{/snippet}
			</Card>

			<!-- Random puzzle -->
			<Card variant="terminal" hoverEffect class="group">
				{#snippet header()}
					<span class="text-accent-tertiary">{m.cruzadas_aleatorio()}</span>
				{/snippet}
				{#snippet children()}
					<div class="space-y-5">
						<div class="inline-flex h-14 w-14 items-center justify-center border border-accent-tertiary/30 bg-accent-tertiary/5 cyber-chamfer-sm transition-all duration-200 group-hover:cyber-glow-tertiary">
							<Shuffle class="h-7 w-7 text-accent-tertiary" strokeWidth={1.5} />
						</div>

						<p class="font-body text-sm leading-relaxed text-muted-foreground">
							{m.cruzadas_aleatorio_desc()}
						</p>

						<Button variant="outline" href="/games/crossword/play?mode=random&difficulty={selectedDifficulty}">
							{m.cruzadas_jogar()}
							<ChevronRight class="ml-1 h-4 w-4" strokeWidth={2} />
						</Button>
					</div>
				{/snippet}
			</Card>
		</div>

		<!-- Back link -->
		<div class="mt-8 text-center">
			<Button variant="ghost" href="/#jogos">
				{m.comum_voltar()}
			</Button>
		</div>
	</div>
</section>
