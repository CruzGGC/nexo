<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import {
		Crosshair,
		Grid3x3,
		Search,
		Ship,
		Zap,
		Trophy,
		Users,
		Clock
	} from 'lucide-svelte';

	const games = [
		{
			icon: Crosshair,
			title: () => m.features_crossword_title(),
			desc: () => m.features_crossword_desc(),
			color: 'accent' as const,
			available: true,
			href: '/games/crossword'
		},
		{
			icon: Search,
			title: () => m.features_wordsearch_title(),
			desc: () => m.features_wordsearch_desc(),
			color: 'tertiary' as const,
			available: true,
			href: '/games/wordsearch'
		},
		{
			icon: Grid3x3,
			title: () => m.features_tictactoe_title(),
			desc: () => m.features_tictactoe_desc(),
			color: 'secondary' as const,
			available: true,
			href: '/multiplayer'
		},
		{
			icon: Ship,
			title: () => m.features_battleship_title(),
			desc: () => m.features_battleship_desc(),
			color: 'accent' as const,
			available: true,
			href: '/multiplayer'
		}
	];

	const stats = [
		{ value: '4', label: () => m.stats_jogos(), icon: Zap },
		{ value: '⚡', label: () => m.stats_tempo_real(), icon: Clock },
		{ value: '∞', label: () => m.stats_classificacoes(), icon: Trophy },
		{ value: '2P', label: () => m.stats_multijogador(), icon: Users }
	];

	// Terminal animation lines
	const terminalLines = [
		{ text: () => m.hero_terminal_line1(), delay: 0 },
		{ text: () => m.hero_terminal_line2(), delay: 1 },
		{ text: () => m.hero_terminal_line3(), delay: 2 }
	];

	const colorVariants = {
		accent: {
			iconBorder: 'border-accent/30 bg-accent/5',
			iconColor: 'text-accent',
			glowClass: 'group-hover:cyber-glow-sm'
		},
		secondary: {
			iconBorder: 'border-accent-secondary/30 bg-accent-secondary/5',
			iconColor: 'text-accent-secondary',
			glowClass: 'group-hover:cyber-glow-secondary'
		},
		tertiary: {
			iconBorder: 'border-accent-tertiary/30 bg-accent-tertiary/5',
			iconColor: 'text-accent-tertiary',
			glowClass: 'group-hover:cyber-glow-tertiary'
		}
	};
</script>

<svelte:head>
	<title>Nexo — A Arena de Jogos de Palavras e Estratégia</title>
	<meta name="description" content={m.hero_subtitle()} />
</svelte:head>

<!-- ================================================================
     HERO SECTION
     ================================================================ -->
<section class="relative flex min-h-[90vh] items-center overflow-hidden">
	<!-- Background effects -->
	<div class="cyber-grid absolute inset-0"></div>
	<div class="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-accent/5 blur-[120px]"></div>
	<div class="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-accent-secondary/5 blur-[120px]"></div>

	<div class="relative mx-auto w-full max-w-7xl px-4 py-24 lg:px-8">
		<div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-5">
			<!-- Left content (3/5) -->
			<div class="lg:col-span-3">
				<!-- Status badge -->
				<div class="mb-6 inline-flex items-center gap-2">
					<span class="h-2 w-2 animate-[pulseGlow_2s_ease-in-out_infinite] rounded-full bg-accent"></span>
					<Badge variant="accent" glow>{m.hero_terminal_status()}</Badge>
				</div>

				<!-- Main title -->
				<h1 class="mb-4 font-heading text-6xl font-black leading-none text-foreground md:text-7xl lg:text-8xl xl:text-9xl">
					<GlitchText
						text={m.hero_title()}
						tag="span"
						class="text-accent cyber-text-glow"
					/>
				</h1>

				<!-- Subtitle with cursor -->
				<p class="mb-8 max-w-xl font-body text-base leading-relaxed tracking-wide text-muted-foreground md:text-lg">
					{m.hero_subtitle()}<span class="ml-1 inline-block animate-blink text-accent">_</span>
				</p>

				<!-- CTA buttons -->
				<div class="flex flex-wrap gap-4">
					<Button variant="glitch" size="lg" href="/auth/register">
						{m.hero_cta_primary()}
					</Button>
					<Button variant="outline" size="lg" href="/#jogos">
						{m.hero_cta_secondary()}
					</Button>
				</div>
			</div>

			<!-- Right HUD panel (2/5) — hidden on mobile -->
			<div class="hidden lg:col-span-2 lg:block">
				<Card variant="holographic" class="font-accent">
					{#snippet children()}
						<!-- Terminal output -->
						<div class="space-y-3">
							{#each terminalLines as line, i}
								<div class="flex items-start gap-2 text-sm" style="animation-delay: {line.delay}s">
									<span class="text-accent">$</span>
									<span class="text-muted-foreground">{line.text()}</span>
								</div>
							{/each}

							<div class="mt-4 border-t border-border pt-4">
								<div class="flex items-center justify-between text-xs">
									<span class="text-muted-foreground">{m.hero_terminal_players()}</span>
									<span class="text-accent cyber-text-glow">--</span>
								</div>
								<div class="mt-2 flex items-center justify-between text-xs">
									<span class="text-muted-foreground">{m.hero_terminal_uptime()}</span>
									<span class="text-accent-tertiary">99.9%</span>
								</div>
							</div>

							<!-- Blinking prompt -->
							<div class="mt-3 flex items-center gap-2 text-sm">
								<span class="text-accent">&gt;</span>
								<span class="animate-blink text-accent">_</span>
							</div>
						</div>
					{/snippet}
				</Card>
			</div>
		</div>
	</div>
</section>

<!-- ================================================================
     STATS BAR
     ================================================================ -->
<section class="relative border-y border-border bg-card/50">
	<div class="mx-auto max-w-7xl px-4 py-6 lg:px-8">
		<div class="grid grid-cols-2 gap-4 md:flex md:items-center md:justify-between md:divide-x md:divide-border md:gap-0">
			{#each stats as stat}
				<div class="flex items-center gap-3 md:px-8 first:md:pl-0 last:md:pr-0">
					<stat.icon class="h-5 w-5 text-accent" strokeWidth={1.5} />
					<div>
						<p class="font-heading text-lg font-bold text-foreground">{stat.value}</p>
						<p class="font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
							{stat.label()}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ================================================================
     FEATURES / GAME MODULES
     ================================================================ -->
<section id="jogos" class="relative py-24 lg:py-32">
	<!-- Circuit background -->
	<div class="cyber-grid absolute inset-0 opacity-50"></div>

	<div class="relative mx-auto max-w-7xl px-4 lg:px-8">
		<!-- Section heading -->
		<div class="mb-16 text-center">
			<Badge variant="accent" glow class="mb-4">{m.features_title()}</Badge>
			<h2 class="mt-4 font-heading text-4xl font-bold text-foreground md:text-5xl">
				{m.features_title()}
			</h2>
			<p class="mx-auto mt-4 max-w-lg font-body text-base tracking-wide text-muted-foreground">
				{m.features_subtitle()}
			</p>
			<!-- Accent line -->
			<div class="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
		</div>

		<!-- Game cards grid -->
		<div class="-skew-y-1 transform">
			<div class="grid skew-y-1 transform grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{#each games as game}
					{@const cv = colorVariants[game.color]}
					<Card variant="terminal" hoverEffect class="group">
						{#snippet header()}
							<span class={cv.iconColor}>{game.title()}</span>
						{/snippet}
						{#snippet children()}
							<div class="space-y-4">
								<!-- Icon -->
								<div
									class="inline-flex h-12 w-12 items-center justify-center border cyber-chamfer-sm transition-all duration-200 {cv.iconBorder} {cv.glowClass}"
								>
									<game.icon class="h-6 w-6 {cv.iconColor}" strokeWidth={1.5} />
								</div>

								<!-- Description -->
								<p class="font-body text-sm leading-relaxed text-muted-foreground">
									{game.desc()}
								</p>

								<!-- Status -->
								<div class="pt-2">
									{#if game.available && game.href}
										<Button variant="outline" size="sm" href={game.href}>
											{m.comum_jogar()}
										</Button>
									{:else}
										<Badge variant="muted">{m.comum_em_breve()}</Badge>
									{/if}
								</div>
							</div>
						{/snippet}
					</Card>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ================================================================
     BOTTOM CTA
     ================================================================ -->
<section class="relative border-t border-border py-24">
	<div class="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background"></div>
	<div class="relative mx-auto max-w-2xl px-4 text-center lg:px-8">
		<h2 class="font-heading text-3xl font-bold text-foreground md:text-4xl">
			Pronto para entrar?
		</h2>
		<p class="mx-auto mt-4 max-w-md font-body text-base tracking-wide text-muted-foreground">
			Cria a tua conta e desafia jogadores de todo o país. A arena espera por ti.
		</p>
		<div class="mt-8 flex flex-wrap justify-center gap-4">
			<Button variant="glitch" size="lg" href="/auth/register">
				{m.hero_cta_primary()}
			</Button>
		</div>
	</div>
</section>
