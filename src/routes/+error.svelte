<script lang="ts">
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import * as m from '$lib/paraglide/messages';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
</script>

<svelte:head>
	<title>{page.status} — Nexo</title>
</svelte:head>

<section class="relative flex min-h-[80vh] items-center justify-center">
	<!-- Circuit background -->
	<div class="cyber-grid absolute inset-0"></div>

	<div class="relative mx-auto w-full max-w-lg px-4" in:fly={{ y: 30, duration: 300 }}>
		<Card variant="terminal" class="text-center">
			{#snippet header()}
				<span class="text-destructive">{m.error_titulo()}</span>
			{/snippet}
			{#snippet children()}
				<div class="space-y-6 py-4">
					<!-- Error code -->
					<GlitchText
						text={String(page.status)}
						tag="h1"
						class="font-heading text-7xl font-black text-destructive"
					/>

					<!-- Error message -->
					<div class="space-y-2">
						<p class="font-body text-sm text-muted-foreground">
							<span class="text-accent">&gt;</span>
							{#if page.status === 404}
								{m.error_404_mensagem()}
							{:else}
								{m.error_mensagem()}
							{/if}
						</p>
						{#if page.error?.message}
							<p class="font-accent text-xs text-muted-foreground">
								<span class="text-destructive">[ERR]</span> {page.error.message}
							</p>
						{/if}
					</div>

					<!-- Action -->
					<div class="pt-2">
						<Button variant="default" href="/">
							{m.error_voltar()}
						</Button>
					</div>
				</div>
			{/snippet}
		</Card>
	</div>
</section>
