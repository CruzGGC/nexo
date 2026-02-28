<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import Button from '$lib/components/ui/Button.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';

	interface Props {
		user?: { id: string; username: string; email: string; name?: string; avatar?: string } | null;
	}

	let { user = null }: Props = $props();

	let mobileOpen = $state(false);

	function toggleMobile() {
		mobileOpen = !mobileOpen;
	}

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<nav class="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2" onclick={closeMobile}>
			<GlitchText text="NEXO" tag="span" class="font-heading text-xl font-black text-accent cyber-text-glow" />
			<span class="hidden font-accent text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:inline">
				v2.0
			</span>
		</a>

		<!-- Desktop nav -->
		<div class="hidden items-center gap-8 lg:flex">
			<a
				href="/#jogos"
				class="font-accent text-sm uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-accent"
			>
				{m.nav_jogar()}
			</a>
			<a
				href="/multiplayer"
				class="font-accent text-sm uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-accent"
			>
				{m.nav_multijogador()}
			</a>
			<a
				href="/leaderboard"
				class="font-accent text-sm uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-accent"
			>
				{m.nav_classificacoes()}
			</a>
		</div>

		<!-- Desktop CTA -->
		<div class="hidden items-center gap-3 lg:flex">
			{#if user}
				<Button variant="ghost" size="sm" href="/profile">
					{m.nav_perfil()}
				</Button>
				<form method="POST" action="/auth/logout" use:enhance>
					<Button type="submit" variant="outline" size="sm">
						{m.nav_sair()}
					</Button>
				</form>
			{:else}
				<Button variant="ghost" size="sm" href="/auth/login">
					{m.nav_entrar()}
				</Button>
				<Button variant="default" size="sm" href="/auth/register">
					{m.nav_registar()}
				</Button>
			{/if}
		</div>

		<!-- Mobile hamburger -->
		<button
			class="flex h-10 w-10 items-center justify-center text-foreground lg:hidden"
			onclick={toggleMobile}
			aria-label="Menu"
		>
			{#if mobileOpen}
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="border-t border-border bg-background/95 backdrop-blur-md lg:hidden" transition:slide={{ duration: 200 }}>
			<div class="flex flex-col gap-2 px-4 py-4">
				<a
					href="/#jogos"
					class="py-2 font-accent text-sm uppercase tracking-wider text-muted-foreground"
					onclick={closeMobile}
				>
					{m.nav_jogar()}
				</a>
				<a
					href="/multiplayer"
					class="py-2 font-accent text-sm uppercase tracking-wider text-muted-foreground"
					onclick={closeMobile}
				>
					{m.nav_multijogador()}
				</a>
				<a
					href="/leaderboard"
					class="py-2 font-accent text-sm uppercase tracking-wider text-muted-foreground"
					onclick={closeMobile}
				>
					{m.nav_classificacoes()}
				</a>
				<div class="mt-2 flex flex-col gap-2 border-t border-border pt-4">
					{#if user}
						<Button variant="ghost" size="sm" href="/profile" onclick={closeMobile}>
							{m.nav_perfil()}
						</Button>
						<form method="POST" action="/auth/logout" use:enhance>
							<Button type="submit" variant="outline" size="sm" class="w-full">
								{m.nav_sair()}
							</Button>
						</form>
					{:else}
						<Button variant="ghost" size="sm" href="/auth/login" onclick={closeMobile}>
							{m.nav_entrar()}
						</Button>
						<Button variant="default" size="sm" href="/auth/register" onclick={closeMobile}>
							{m.nav_registar()}
						</Button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</nav>
