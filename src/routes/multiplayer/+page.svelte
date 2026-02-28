<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import GlitchText from '$lib/components/effects/GlitchText.svelte';
	import {
		Swords,
		Ship,
		Search,
		Plus,
		LogIn,
		Loader,
		X,
		Grid3X3
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// User comes from root layout
	let user = $derived(page.data.user);

	// ─── State ────────────────────────────────────────────
	type GameChoice = 'tictactoe' | 'battleship';
	type LobbyMode = 'idle' | 'searching' | 'creating' | 'joining';

	let selectedGame = $state<GameChoice>('tictactoe');
	let lobbyMode = $state<LobbyMode>('idle');
	let joinCode = $state('');
	let errorMessage = $state('');
	let searchPollTimer: ReturnType<typeof setInterval> | null = null;

	// ─── Find game (matchmaking) ──────────────────────────

	async function findGame() {
		if (!user) {
			errorMessage = m.multi_login_necessario();
			return;
		}

		errorMessage = '';
		lobbyMode = 'searching';

		try {
			const res = await fetch('/api/matchmaking', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ gameType: selectedGame })
			});

			const data = await res.json();

			if (!data.success) {
				errorMessage = m.multi_erro_generico();
				lobbyMode = 'idle';
				return;
			}

			if (data.matched && data.roomId) {
				// Matched immediately — go to room
				await goto(`/multiplayer/room/${data.roomId}`);
				return;
			}

			// Queued — start polling for match
			startMatchPoll();
		} catch {
			errorMessage = m.multi_erro_generico();
			lobbyMode = 'idle';
		}
	}

	function startMatchPoll() {
		searchPollTimer = setInterval(async () => {
			try {
				const res = await fetch('/api/matchmaking');
				const data = await res.json();

				if (data.status === 'matched' && data.roomId) {
					stopMatchPoll();
					lobbyMode = 'idle';
					await goto(`/multiplayer/room/${data.roomId}`);
				}
			} catch {
				// Keep polling
			}
		}, 2000);
	}

	function stopMatchPoll() {
		if (searchPollTimer) {
			clearInterval(searchPollTimer);
			searchPollTimer = null;
		}
	}

	async function cancelSearch() {
		stopMatchPoll();

		try {
			await fetch('/api/matchmaking', { method: 'DELETE' });
		} catch {
			// Ignore
		}

		lobbyMode = 'idle';
	}

	// ─── Create private room ──────────────────────────────

	async function createRoom() {
		if (!user) {
			errorMessage = m.multi_login_necessario();
			return;
		}

		errorMessage = '';
		lobbyMode = 'creating';

		try {
			const res = await fetch('/api/rooms', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ gameType: selectedGame })
			});

			const data = await res.json();

			if (data.success && data.roomId) {
				await goto(`/multiplayer/room/${data.roomId}`);
			} else {
				errorMessage = m.multi_erro_generico();
				lobbyMode = 'idle';
			}
		} catch {
			errorMessage = m.multi_erro_generico();
			lobbyMode = 'idle';
		}
	}

	// ─── Join by code ─────────────────────────────────────

	async function joinRoom() {
		if (!user) {
			errorMessage = m.multi_login_necessario();
			return;
		}

		const code = joinCode.trim().toUpperCase();
		if (code.length !== 6) return;

		errorMessage = '';
		lobbyMode = 'joining';

		try {
			const res = await fetch('/api/rooms/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomCode: code })
			});

			const data = await res.json();

			if (data.success && data.roomId) {
				await goto(`/multiplayer/room/${data.roomId}`);
			} else {
				if (data.error === 'room_full') {
					errorMessage = m.multi_sala_cheia();
				} else if (data.error === 'room_not_found') {
					errorMessage = m.multi_sala_nao_encontrada();
				} else {
					errorMessage = m.multi_erro_generico();
				}
				lobbyMode = 'idle';
			}
		} catch {
			errorMessage = m.multi_erro_generico();
			lobbyMode = 'idle';
		}
	}
</script>

<svelte:head>
	<title>Nexo — {m.multi_titulo()}</title>
</svelte:head>

<section class="relative py-12 lg:py-20">
	<div class="cyber-grid absolute inset-0 opacity-20"></div>

	<div class="relative mx-auto max-w-3xl px-4 lg:px-8">
		<!-- Header -->
		<div class="mb-10 text-center">
			<h1 class="font-heading text-3xl font-black uppercase tracking-wider lg:text-4xl">
				<GlitchText text={m.multi_titulo()} tag="span" class="text-accent cyber-text-glow" />
			</h1>
			<p class="mt-3 font-body text-sm text-muted-foreground">
				{m.multi_subtitulo()}
			</p>
		</div>

		<!-- Game selection -->
		<div class="mb-8">
			<p class="mb-3 font-accent text-xs uppercase tracking-widest text-muted-foreground">
				{m.multi_escolhe_jogo()}
			</p>
			<div class="grid grid-cols-2 gap-4">
				<button
					class="group flex items-center gap-3 border px-4 py-3 transition-all duration-150 {selectedGame === 'tictactoe' ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card/50 text-muted-foreground hover:border-accent/50 hover:text-foreground'}"
					onclick={() => { selectedGame = 'tictactoe'; }}
				>
					<Grid3X3 class="h-6 w-6" strokeWidth={1.5} />
					<span class="font-accent text-sm uppercase tracking-wider">{m.multi_jogo_galo()}</span>
				</button>

				<button
					class="group flex items-center gap-3 border px-4 py-3 transition-all duration-150 {selectedGame === 'battleship' ? 'border-accent-tertiary bg-accent-tertiary/10 text-accent-tertiary' : 'border-border bg-card/50 text-muted-foreground hover:border-accent-tertiary/50 hover:text-foreground'}"
					onclick={() => { selectedGame = 'battleship'; }}
				>
					<Ship class="h-6 w-6" strokeWidth={1.5} />
					<span class="font-accent text-sm uppercase tracking-wider">{m.multi_jogo_batalha()}</span>
				</button>
			</div>
		</div>

		<!-- Error message -->
		{#if errorMessage}
			<div class="mb-6 border border-destructive/50 bg-destructive/10 px-4 py-3">
				<p class="font-body text-sm text-destructive">{errorMessage}</p>
			</div>
		{/if}

		<!-- Lobby options -->
		{#if lobbyMode === 'searching'}
			<!-- Searching state -->
			<Card variant="terminal" class="mx-auto max-w-md">
				{#snippet children()}
					<div class="space-y-6 p-4 text-center">
						<Loader class="mx-auto h-10 w-10 animate-spin text-accent" strokeWidth={1.5} />
						<div>
							<p class="font-heading text-lg font-bold text-foreground">
								{m.multi_a_procurar()}
							</p>
						</div>
						<Button variant="outline" size="sm" onclick={cancelSearch}>
							<X class="mr-1 h-4 w-4" strokeWidth={2} />
							{m.multi_cancelar_procura()}
						</Button>
					</div>
				{/snippet}
			</Card>
		{:else if lobbyMode === 'creating' || lobbyMode === 'joining'}
			<!-- Loading state -->
			<Card variant="terminal" class="mx-auto max-w-md">
				{#snippet children()}
					<div class="space-y-4 p-4 text-center">
						<Loader class="mx-auto h-10 w-10 animate-spin text-accent" strokeWidth={1.5} />
						<p class="font-body text-sm text-muted-foreground">
							{m.multi_a_ligar()}
						</p>
					</div>
				{/snippet}
			</Card>
		{:else}
			<!-- Idle — show all three options -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Find game -->
				<Card variant="default" class="text-center">
					{#snippet children()}
						<div class="space-y-4 p-4">
							<Search class="mx-auto h-8 w-8 text-accent" strokeWidth={1.5} />
							<div>
								<h3 class="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
									{m.multi_procurar_jogo()}
								</h3>
								<p class="mt-1 font-body text-xs text-muted-foreground">
									{m.multi_procurar_jogo_desc()}
								</p>
							</div>
							<Button variant="default" size="sm" class="w-full" onclick={findGame}>
								<Swords class="mr-1 h-4 w-4" strokeWidth={2} />
								{m.multi_procurar_jogo()}
							</Button>
						</div>
					{/snippet}
				</Card>

				<!-- Create private room -->
				<Card variant="default" class="text-center">
					{#snippet children()}
						<div class="space-y-4 p-4">
							<Plus class="mx-auto h-8 w-8 text-accent-secondary" strokeWidth={1.5} />
							<div>
								<h3 class="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
									{m.multi_sala_privada()}
								</h3>
								<p class="mt-1 font-body text-xs text-muted-foreground">
									{m.multi_sala_privada_desc()}
								</p>
							</div>
							<Button variant="secondary" size="sm" class="w-full" onclick={createRoom}>
								<Plus class="mr-1 h-4 w-4" strokeWidth={2} />
								{m.multi_criar_sala()}
							</Button>
						</div>
					{/snippet}
				</Card>

				<!-- Join by code -->
				<Card variant="default" class="text-center">
					{#snippet children()}
						<div class="space-y-4 p-4">
							<LogIn class="mx-auto h-8 w-8 text-accent-tertiary" strokeWidth={1.5} />
							<div>
								<h3 class="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
									{m.multi_entrar_sala()}
								</h3>
								<p class="mt-1 font-body text-xs text-muted-foreground">
									{m.multi_entrar_sala_desc()}
								</p>
							</div>
							<div class="flex gap-2">
								<Input
									type="text"
									placeholder={m.multi_codigo_placeholder()}
									bind:value={joinCode}
									maxlength={6}
									class="text-center font-heading uppercase tracking-[0.15em]"
								/>
								<Button
									variant="outline"
									size="sm"
									onclick={joinRoom}
									disabled={joinCode.trim().length !== 6}
								>
									<LogIn class="h-4 w-4" strokeWidth={2} />
								</Button>
							</div>
						</div>
					{/snippet}
				</Card>
			</div>

			<!-- Login prompt for guests -->
			{#if !user}
				<div class="mt-8 text-center">
					<p class="font-body text-sm text-muted-foreground">
						{m.multi_login_necessario()}
					</p>
					<Button variant="ghost" size="sm" href="/auth/login" class="mt-2">
						{m.nav_entrar()}
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</section>
