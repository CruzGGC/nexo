<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';

	let { form } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>{m.auth_entrar_titulo()} — Nexo</title>
</svelte:head>

<!-- Header -->
<div class="mb-8 text-center">
	<GlitchText text={m.auth_entrar_titulo()} tag="h1" class="font-heading text-3xl font-black text-accent cyber-text-glow" />
	<p class="mt-3 font-body text-sm text-muted-foreground">
		{m.auth_entrar_subtitulo()}
	</p>
</div>

<!-- Login form card -->
<Card variant="terminal">
	{#snippet header()}
		{m.auth_entrar_terminal()}
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
					{m.auth_erro_credenciais()}
				</p>
			</div>
		{/if}

		<!-- Email -->
		<Input
			name="email"
			type="email"
			label={m.auth_email()}
			placeholder={m.auth_email_placeholder()}
			value={form?.email ?? ''}
			error={form?.errors?.email}
			required
			autocomplete="email"
		/>

		<!-- Password -->
		<Input
			name="password"
			type="password"
			label={m.auth_password()}
			placeholder={m.auth_password_placeholder()}
			error={form?.errors?.password}
			required
			autocomplete="current-password"
		/>

		<!-- Submit -->
		<Button type="submit" variant="default" size="lg" disabled={loading} class="mt-2 w-full">
			{#if loading}
				<span class="animate-pulse">{m.auth_entrar_a_processar()}</span>
			{:else}
				{m.auth_entrar_submit()}
			{/if}
		</Button>
	</form>
</Card>

<!-- Register link -->
<p class="mt-6 text-center font-body text-sm text-muted-foreground">
	{m.auth_sem_conta()}
	<a href="/auth/register" class="font-accent text-accent underline underline-offset-4 transition-colors hover:text-accent/80">
		{m.auth_criar_conta()}
	</a>
</p>
