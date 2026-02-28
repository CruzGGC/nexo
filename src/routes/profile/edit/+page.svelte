<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';

	let { data, form } = $props();

	let loading = $state(false);

	const profile = $derived(data.profile);
</script>

<svelte:head>
	<title>{m.perfil_editar_titulo()} — Nexo</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12">
	<!-- Header -->
	<div class="mb-8 text-center">
		<GlitchText text={m.perfil_editar_titulo()} tag="h1" class="font-heading text-3xl font-black text-accent cyber-text-glow" />
		<p class="mt-3 font-body text-sm text-muted-foreground">
			{m.perfil_editar_subtitulo()}
		</p>
	</div>

	<!-- Edit form card -->
	<Card variant="terminal">
		{#snippet header()}
			{m.perfil_editar_terminal()}
		{/snippet}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="flex flex-col gap-5"
		>
			<!-- Form-level error -->
			{#if form?.errors?.form}
				<div class="cyber-chamfer-sm border border-destructive/50 bg-destructive/10 px-4 py-3">
					<p class="font-accent text-xs text-destructive">
						{m.auth_erro_generico()}
					</p>
				</div>
			{/if}

			<!-- Username -->
			<Input
				name="username"
				type="text"
				label={m.perfil_username()}
				placeholder={m.auth_username_placeholder()}
				value={form?.username ?? profile.username}
				error={form?.errors?.username === 'auth_erro_username_usado' ? m.auth_erro_username_usado() : form?.errors?.username}
				required
				autocomplete="username"
			/>

			<!-- Display name (optional) -->
			<Input
				name="name"
				type="text"
				label="Nome"
				placeholder="Nome de exibição (opcional)"
				value={form?.name ?? profile.name}
				error={form?.errors?.name}
				autocomplete="name"
			/>

			<!-- Email (read-only) -->
			<div class="flex flex-col gap-1.5">
				<span class="font-accent text-xs uppercase tracking-[0.2em] text-muted-foreground">
					{m.perfil_email()}
				</span>
				<div class="cyber-chamfer-sm w-full border border-border/50 bg-muted/30 py-2.5 pl-4 pr-4 font-body text-sm text-muted-foreground">
					{profile.email}
				</div>
				<span class="font-accent text-[10px] text-muted-foreground/60">
					O email não pode ser alterado aqui.
				</span>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-3 border-t border-border pt-4">
				<Button variant="default" type="submit" size="md" disabled={loading} class="flex-1">
					{#if loading}
						<span class="animate-pulse">{m.perfil_editar_a_processar()}</span>
					{:else}
						{m.perfil_editar_submit()}
					{/if}
				</Button>
				<Button variant="ghost" size="md" href="/profile">
					{m.comum_voltar()}
				</Button>
			</div>
		</form>
	</Card>
</div>
