<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { fade, fly } from 'svelte/transition';
	import type { RoomClient } from '$lib/multiplayer/types';
	import type { TicTacToeState } from '$lib/games/tictactoe/types';
	import type { BattleshipState, BattleshipPlaceAction } from '$lib/games/battleship/types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import WaitingRoom from '$lib/components/games/multiplayer/WaitingRoom.svelte';
	import TicTacToeBoard from '$lib/components/games/tictactoe/TicTacToeBoard.svelte';
	import BattleshipGame from '$lib/components/games/battleship/BattleshipGame.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import { Loader, Trophy, X, Frown, Minus, ArrowLeft, RotateCcw } from 'lucide-svelte';

	// ─── Data from server load ────────────────────────────
	let serverRoom = $derived(page.data.room as RoomClient | null);
	let serverError = $derived(page.data.error as string | null);
	let user = $derived(page.data.user);

	// ─── Live room state (updated via realtime) ──────────
	let room = $state<RoomClient | null>(null);
	let loading = $state(true);
	let actionLoading = $state(false);

	// Merge server data on initial load
	$effect(() => {
		if (serverRoom && !room) {
			room = { ...serverRoom };
			loading = false;
		} else if (serverError) {
			loading = false;
		}
	});

	// ─── Room refresh polling ─────────────────────────────
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	async function refreshRoom() {
		const roomId = page.params.id;
		if (!roomId) return;

		try {
			const res = await fetch(`/api/rooms/${roomId}`);
			const data = await res.json();
			if (data.success && data.room) {
				room = data.room;
			}
		} catch {
			// Keep previous state and try again on next poll
		}
	}

	onMount(() => {
		const roomId = page.params.id;
		if (!roomId || serverError) return;

		pollTimer = setInterval(refreshRoom, 1500);
		refreshRoom();

		return () => {
			if (pollTimer) {
				clearInterval(pollTimer);
				pollTimer = null;
			}
		};
	});

	// ─── Derived state ────────────────────────────────────
	let roomStatus = $derived(room?.status ?? 'waiting');
	let userId = $derived(user?.id ?? '');
	let isWinner = $derived(room?.winner === userId);
	let isDraw = $derived(room?.isDraw ?? false);
	let winnerPlayer = $derived(room?.players.find(p => p.userId === room?.winner));
	let opponentPlayer = $derived(room?.players.find(p => p.userId !== userId));

	// ─── Game-specific derived state ─────────────────────
	let gameType = $derived(room?.gameType ?? 'tictactoe');
	let isMyTurn = $derived(room?.turn === userId);
	let tttState = $derived(
		gameType === 'tictactoe' && room?.boardState
			? room.boardState as TicTacToeState
			: null
	);
	let bsState = $derived(
		gameType === 'battleship' && room?.boardState
			? room.boardState as BattleshipState
			: null
	);

	// ─── Actions ──────────────────────────────────────────
	async function sendAction(actionType: string, actionData: Record<string, unknown> = {}) {
		if (!room || actionLoading) return;

		actionLoading = true;
		try {
			const res = await fetch(`/api/rooms/${room.id}/action`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					actionType,
					actionData,
					version: room.version
				})
			});

			const data = await res.json();
			if (data.success && data.room) {
				room = data.room;
			}
		} catch (err) {
			console.error('Action error:', err);
		} finally {
			actionLoading = false;
		}
	}

	function handleReady() {
		sendAction('ready');
	}

	function handleNotReady() {
		sendAction('not_ready');
	}

	async function handleLeave() {
		if (room && (roomStatus === 'playing')) {
			await sendAction('abandon');
		}
		await goto('/multiplayer');
	}

	function handlePlayAgain() {
		goto('/multiplayer');
	}

	function handleBackToLobby() {
		goto('/multiplayer');
	}

	// ─── Game-specific action handlers ───────────────────
	function handleTicTacToeMove(cell: number) {
		sendAction('place', { cell });
	}

	function handleBattleshipPlace(placements: BattleshipPlaceAction['placements']) {
		sendAction('place_ships', { placements });
	}

	function handleBattleshipShoot(cell: number) {
		sendAction('shoot', { cell });
	}
</script>

<svelte:head>
	<title>Nexo — {m.multi_sala_espera_titulo()}</title>
</svelte:head>

<section class="relative py-12 lg:py-20">
	<div class="cyber-grid absolute inset-0 opacity-20"></div>

	<div class="relative mx-auto max-w-3xl px-4 lg:px-8">
		<!-- Loading state -->
		{#if loading}
			<div class="flex min-h-[50vh] items-center justify-center">
				<div class="space-y-4 text-center">
					<Loader class="mx-auto h-10 w-10 animate-spin text-accent" strokeWidth={1.5} />
					<p class="font-body text-sm text-muted-foreground">
						{m.multi_sala_a_carregar()}
					</p>
				</div>
			</div>

		<!-- Error states -->
		{:else if serverError === 'not_found'}
			<div class="flex min-h-[50vh] items-center justify-center">
				<Card variant="terminal" class="max-w-md">
					{#snippet children()}
						<div class="space-y-4 p-4 text-center">
							<X class="mx-auto h-10 w-10 text-destructive" strokeWidth={1.5} />
							<p class="font-heading text-lg font-bold text-foreground">
								{m.multi_sala_nao_encontrada()}
							</p>
							<Button variant="outline" size="sm" href="/multiplayer">
								<ArrowLeft class="mr-1 h-4 w-4" strokeWidth={2} />
								{m.multi_voltar_lobby()}
							</Button>
						</div>
					{/snippet}
				</Card>
			</div>

		{:else if serverError === 'not_participant'}
			<div class="flex min-h-[50vh] items-center justify-center">
				<Card variant="terminal" class="max-w-md">
					{#snippet children()}
						<div class="space-y-4 p-4 text-center">
							<X class="mx-auto h-10 w-10 text-destructive" strokeWidth={1.5} />
							<p class="font-heading text-lg font-bold text-foreground">
								{m.multi_sala_nao_autorizado()}
							</p>
							<Button variant="outline" size="sm" href="/multiplayer">
								<ArrowLeft class="mr-1 h-4 w-4" strokeWidth={2} />
								{m.multi_voltar_lobby()}
							</Button>
						</div>
					{/snippet}
				</Card>
			</div>

		<!-- Room states -->
		{:else if room}
			<!-- WAITING -->
			{#if roomStatus === 'waiting'}
				<WaitingRoom
					{room}
					{userId}
					onReady={handleReady}
					onNotReady={handleNotReady}
					onLeave={handleLeave}
				/>

			<!-- PLAYING -->
			{:else if roomStatus === 'playing'}
				<div class="flex min-h-[50vh] items-center justify-center">
					<Card variant="terminal" class="w-full {gameType === 'battleship' ? 'max-w-3xl' : 'max-w-lg'}">
						{#snippet header()}
							<div class="flex items-center justify-between">
								<GlitchText text={m.multi_sala_jogo_em_curso()} tag="span" class="text-accent" />
								<div class="flex items-center gap-2 text-sm">
									<span class="font-body text-foreground">{user?.username ?? '???'}</span>
									<span class="font-accent text-xs text-muted-foreground">vs</span>
									<span class="font-body text-foreground">{opponentPlayer?.username ?? '???'}</span>
								</div>
							</div>
						{/snippet}
						{#snippet children()}
							<div class="space-y-4 p-4">
								<!-- Game-specific board -->
								{#if gameType === 'tictactoe' && tttState}
									<TicTacToeBoard
										state={tttState}
										{userId}
										{isMyTurn}
										onMove={handleTicTacToeMove}
										disabled={actionLoading}
									/>
								{:else if gameType === 'battleship' && bsState}
									<BattleshipGame
										gameState={bsState}
										{userId}
										{isMyTurn}
										onPlaceShips={handleBattleshipPlace}
										onShoot={handleBattleshipShoot}
										disabled={actionLoading}
									/>
								{:else}
									<!-- Fallback placeholder for games not yet wired -->
									<div class="border border-dashed border-border/30 px-6 py-12 text-center">
										<p class="font-accent text-xs uppercase tracking-wider text-muted-foreground">
											{m.multi_sala_jogo_em_curso_desc()}
										</p>
									</div>
								{/if}

								<!-- Leave / Abandon -->
								<div class="text-center">
									<Button variant="ghost" size="sm" onclick={handleLeave}>
										{m.multi_sala_sair()}
									</Button>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>

			<!-- FINISHED -->
			{:else if roomStatus === 'finished'}
				<div class="flex min-h-[50vh] items-center justify-center" in:fly={{ y: 20, duration: 300 }}>
					<Card variant="terminal" class="w-full max-w-lg">
						{#snippet header()}
							<GlitchText text={m.multi_sala_resultado_titulo()} tag="span" class="text-accent" />
						{/snippet}
						{#snippet children()}
							<div class="space-y-6 p-4 text-center">
								<!-- Result icon -->
								{#if isWinner}
									<Trophy class="mx-auto h-16 w-16 text-accent cyber-text-glow" strokeWidth={1.5} />
									<p class="font-heading text-2xl font-black uppercase tracking-wider text-accent">
										{m.multi_vitoria()}
									</p>
								{:else if isDraw}
									<Minus class="mx-auto h-16 w-16 text-accent-tertiary" strokeWidth={1.5} />
									<p class="font-heading text-2xl font-black uppercase tracking-wider text-accent-tertiary">
										{m.multi_empate()}
									</p>
								{:else}
									<Frown class="mx-auto h-16 w-16 text-destructive" strokeWidth={1.5} />
									<p class="font-heading text-2xl font-black uppercase tracking-wider text-destructive">
										{m.multi_derrota()}
									</p>
								{/if}

								<!-- Match info -->
								<div class="flex items-center justify-between border border-border/50 bg-card/50 px-4 py-3">
									<div class="text-left">
										<p class="font-body text-sm font-medium text-foreground">
											{user?.username ?? '???'}
										</p>
									</div>
									<span class="font-accent text-xs text-muted-foreground">vs</span>
									<div class="text-right">
										<p class="font-body text-sm font-medium text-foreground">
											{opponentPlayer?.username ?? '???'}
										</p>
									</div>
								</div>

								{#if winnerPlayer}
									<p class="font-accent text-xs uppercase tracking-wider text-muted-foreground">
										Vencedor: <span class="text-accent">{winnerPlayer.username}</span>
									</p>
								{/if}

								<!-- Actions -->
								<div class="flex items-center justify-center gap-3">
									<Button variant="default" size="sm" onclick={handlePlayAgain}>
										<RotateCcw class="mr-1 h-4 w-4" strokeWidth={2} />
										{m.multi_jogar_novamente()}
									</Button>
									<Button variant="outline" size="sm" onclick={handleBackToLobby}>
										<ArrowLeft class="mr-1 h-4 w-4" strokeWidth={2} />
										{m.multi_voltar_lobby()}
									</Button>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>

			<!-- ABANDONED -->
			{:else if roomStatus === 'abandoned'}
				<div class="flex min-h-[50vh] items-center justify-center">
					<Card variant="terminal" class="w-full max-w-lg">
						{#snippet header()}
							<GlitchText text={m.multi_sala_abandonada()} tag="span" class="text-destructive" />
						{/snippet}
						{#snippet children()}
							<div class="space-y-6 p-4 text-center">
								<X class="mx-auto h-12 w-12 text-destructive" strokeWidth={1.5} />
								<p class="font-body text-sm text-muted-foreground">
									{m.multi_sala_abandonada_desc()}
								</p>
								<Button variant="outline" size="sm" onclick={handleBackToLobby}>
									<ArrowLeft class="mr-1 h-4 w-4" strokeWidth={2} />
									{m.multi_voltar_lobby()}
								</Button>
							</div>
						{/snippet}
					</Card>
				</div>
			{/if}
		{/if}
	</div>
</section>
