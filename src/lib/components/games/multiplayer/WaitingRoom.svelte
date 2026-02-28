<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { RoomClient } from '$lib/multiplayer/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import { Copy, Check, LogOut, UserCheck, UserX, Loader } from 'lucide-svelte';

	interface Props {
		room: RoomClient;
		userId: string;
		onReady: () => void;
		onNotReady: () => void;
		onLeave: () => void;
	}

	let { room, userId, onReady, onNotReady, onLeave }: Props = $props();

	let codeCopied = $state(false);

	let currentPlayer = $derived(room.players.find(p => p.userId === userId));
	let isReady = $derived(currentPlayer?.ready ?? false);
	let allReady = $derived(room.players.length >= 2 && room.players.every(p => p.ready));

	function copyCode() {
		navigator.clipboard.writeText(room.roomCode).then(() => {
			codeCopied = true;
			setTimeout(() => { codeCopied = false; }, 2000);
		});
	}

	function toggleReady() {
		if (isReady) {
			onNotReady();
		} else {
			onReady();
		}
	}
</script>

<div class="flex min-h-[50vh] items-center justify-center py-12">
	<Card variant="terminal" class="w-full max-w-lg">
		{#snippet header()}
			<GlitchText text={m.multi_sala_espera_titulo()} tag="span" class="text-accent" />
		{/snippet}
		{#snippet children()}
			<div class="space-y-6 p-2">
				<!-- Room info -->
				<p class="font-body text-sm text-muted-foreground">
					{m.multi_sala_espera_desc()}
				</p>

				<!-- Room code (for private rooms) -->
				{#if room.isPrivate}
					<div class="flex items-center justify-between border border-border bg-background/50 px-4 py-3">
						<div>
							<p class="font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
								{m.multi_sala_codigo_label()}
							</p>
							<p class="mt-1 font-heading text-2xl font-bold tracking-[0.2em] text-accent cyber-text-glow">
								{room.roomCode}
							</p>
						</div>
						<Button variant="ghost" size="sm" onclick={copyCode}>
							{#if codeCopied}
								<Check class="mr-1 h-4 w-4 text-accent" strokeWidth={2} />
								{m.multi_sala_codigo_copiado()}
							{:else}
								<Copy class="mr-1 h-4 w-4" strokeWidth={2} />
								{m.multi_sala_codigo_copiar()}
							{/if}
						</Button>
					</div>
				{/if}

				<!-- Players list -->
				<div class="space-y-3">
					{#each room.players as player}
						<div class="flex items-center justify-between border border-border/50 bg-card/50 px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center border border-border bg-background font-accent text-xs uppercase text-muted-foreground">
									{player.username.charAt(0)}
								</div>
								<div>
									<p class="font-body text-sm font-medium text-foreground">
										{player.username}
										{#if player.userId === userId}
											<Badge variant="accent" class="ml-2">{m.leaderboard_tu()}</Badge>
										{/if}
									</p>
								</div>
							</div>
							<div>
								{#if player.ready}
									<Badge variant="accent">
										<UserCheck class="mr-1 h-3 w-3" strokeWidth={2} />
										{m.multi_sala_pronto()}
									</Badge>
								{:else}
									<Badge variant="muted">
										<UserX class="mr-1 h-3 w-3" strokeWidth={2} />
										{m.multi_sala_nao_pronto()}
									</Badge>
								{/if}
							</div>
						</div>
					{/each}

					<!-- Empty slot -->
					{#if room.players.length < 2}
						<div class="flex items-center justify-center border border-dashed border-border/30 px-4 py-3">
							<div class="flex items-center gap-2 text-muted-foreground">
								<Loader class="h-4 w-4 animate-spin" strokeWidth={1.5} />
								<span class="font-accent text-xs uppercase tracking-wider">
									{m.multi_sala_espera_desc()}
								</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Status message -->
				{#if allReady}
					<p class="text-center font-accent text-xs uppercase tracking-wider text-accent animate-pulse">
						{m.multi_sala_iniciar()}...
					</p>
				{/if}

				<!-- Actions -->
				<div class="flex items-center justify-between gap-3">
					<Button variant="ghost" size="sm" onclick={onLeave}>
						<LogOut class="mr-1 h-4 w-4" strokeWidth={2} />
						{m.multi_sala_sair()}
					</Button>

					{#if room.players.length >= 2}
						<Button
							variant={isReady ? 'outline' : 'default'}
							size="sm"
							onclick={toggleReady}
						>
							{#if isReady}
								{m.multi_sala_nao_pronto()}
							{:else}
								{m.multi_sala_pronto()}
							{/if}
						</Button>
					{/if}
				</div>
			</div>
		{/snippet}
	</Card>
</div>
