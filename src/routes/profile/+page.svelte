<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';

	let { data } = $props();

	const profile = $derived(data.profile);
	const callsign = $derived((profile.username || '').trim());

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		try {
			return new Intl.DateTimeFormat('pt-PT', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			}).format(new Date(dateStr));
		} catch {
			return dateStr;
		}
	}
</script>

<svelte:head>
	<title>{m.perfil_titulo()} — Nexo</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12">
	<!-- Header -->
	<div class="mb-8 text-center">
		<GlitchText text={m.perfil_titulo()} tag="h1" class="font-heading text-3xl font-black text-accent cyber-text-glow" />
		<p class="mt-3 font-body text-sm text-muted-foreground">
			{m.perfil_subtitulo()}
		</p>
	</div>

	<!-- Profile card -->
	<Card variant="terminal">
		{#snippet header()}
			{m.perfil_terminal()}
		{/snippet}

		<div class="flex flex-col gap-6">
			<!-- Avatar + name section -->
			<div class="flex items-center gap-5">
				<!-- Avatar placeholder -->
				<div class="flex h-16 w-16 items-center justify-center cyber-chamfer border-2 border-accent bg-accent/10">
					<span class="font-heading text-2xl font-black text-accent">
						{callsign ? callsign[0]?.toUpperCase() : '?'}
					</span>
				</div>
				<div>
					<h2 class="font-heading text-lg font-bold text-foreground">{callsign || '—'}</h2>
					<Badge variant="accent">{m.status_online()}</Badge>
				</div>
			</div>

			<!-- Data rows -->
			<div class="flex flex-col gap-4 border-t border-border pt-4">
				<!-- Username -->
				<div class="flex items-center justify-between">
					<span class="font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
						{m.perfil_username()}
					</span>
					<span class="font-body text-sm text-foreground">{callsign || '—'}</span>
				</div>

				<!-- Email -->
				<div class="flex items-center justify-between">
					<span class="font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
						{m.perfil_email()}
					</span>
					<span class="font-body text-sm text-foreground">{profile.email}</span>
				</div>

				<!-- Member since -->
				<div class="flex items-center justify-between">
					<span class="font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
						{m.perfil_membro_desde()}
					</span>
					<span class="font-body text-sm text-foreground">{formatDate(profile.created)}</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="border-t border-border pt-4">
				<Button variant="default" size="md" href="/profile/edit" class="w-full">
					{m.perfil_editar()}
				</Button>
			</div>
		</div>
	</Card>
</div>
