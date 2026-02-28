<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
</script>

<footer class="relative border-t border-border bg-background">
	<!-- Circuit grid decoration -->
	<div class="cyber-grid absolute inset-0 opacity-30"></div>

	<div class="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Brand -->
			<div class="md:col-span-2">
				<GlitchText text="NEXO" tag="span" class="font-heading text-2xl font-black text-accent" />
				<p class="mt-3 max-w-sm font-body text-sm leading-relaxed text-muted-foreground">
					{m.hero_subtitle()}
				</p>
			</div>

			<!-- Links -->
			<div>
				<h4 class="mb-3 font-accent text-xs uppercase tracking-[0.2em] text-accent">
					{m.features_title()}
				</h4>
				<ul class="flex flex-col gap-2">
					<li>
						<a href="/#jogos" class="font-body text-sm text-muted-foreground transition-colors hover:text-accent">
							{m.features_crossword_title()}
						</a>
					</li>
					<li>
						<a href="/#jogos" class="font-body text-sm text-muted-foreground transition-colors hover:text-accent">
							{m.features_wordsearch_title()}
						</a>
					</li>
					<li>
						<a href="/#jogos" class="font-body text-sm text-muted-foreground transition-colors hover:text-accent">
							{m.features_tictactoe_title()}
						</a>
					</li>
					<li>
						<a href="/#jogos" class="font-body text-sm text-muted-foreground transition-colors hover:text-accent">
							{m.features_battleship_title()}
						</a>
					</li>
				</ul>
			</div>

			<!-- Platform -->
			<div>
				<h4 class="mb-3 font-accent text-xs uppercase tracking-[0.2em] text-accent">
					{m.footer_plataforma()}
				</h4>
				<ul class="flex flex-col gap-2">
					<li>
						<a href="/auth/login" class="font-body text-sm text-muted-foreground transition-colors hover:text-accent">
							{m.nav_entrar()}
						</a>
					</li>
					<li>
						<a href="/auth/register" class="font-body text-sm text-muted-foreground transition-colors hover:text-accent">
							{m.nav_registar()}
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- Bottom bar -->
		<div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
			<p class="font-accent text-xs uppercase tracking-wider text-muted-foreground">
				&copy; {new Date().getFullYear()} Nexo. {m.footer_direitos()}
			</p>
			<div class="flex items-center gap-2">
				<span class="h-2 w-2 animate-[pulseGlow_2s_ease-in-out_infinite] rounded-full bg-accent"></span>
				<span class="font-accent text-xs uppercase tracking-wider text-accent">
					{m.hero_terminal_status()}
				</span>
			</div>
		</div>
	</div>
</footer>
