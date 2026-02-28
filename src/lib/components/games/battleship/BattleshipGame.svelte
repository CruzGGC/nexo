<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type {
		BattleshipState,
		BattleshipPlaceAction,
		Ship,
		Orientation,
		OwnCell,
		ShipTemplate
	} from '$lib/games/battleship/types';
	import {
		FLEET,
		BOARD_SIZE,
		toIndex,
		fromIndex,
		getShipCells,
		isShipSunk
	} from '$lib/games/battleship/types';
	import BattleshipGrid from './BattleshipGrid.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { RotateCw, Check, Crosshair, Clock, Anchor, Ship as ShipIcon } from 'lucide-svelte';

	interface Props {
		gameState: BattleshipState;
		userId: string;
		isMyTurn: boolean;
		onPlaceShips: (placements: BattleshipPlaceAction['placements']) => void;
		onShoot: (cell: number) => void;
		disabled?: boolean;
	}

	let { gameState, userId, isMyTurn, onPlaceShips, onShoot, disabled = false }: Props = $props();

	// ─── Placement phase state ────────────────────────────
	let orientation = $state<Orientation>('horizontal');
	let placedShips = $state<Array<{ shipId: string; row: number; col: number; orientation: Orientation }>>([]);
	let hoverCell = $state<number | null>(null);

	// ─── Derived state ────────────────────────────────────
	let myBoard = $derived(gameState.boards[userId]);
	let opponentId = $derived(Object.keys(gameState.boards).find(id => id !== userId) ?? '');
	let opponentBoard = $derived(gameState.boards[opponentId]);
	let isPlacement = $derived(gameState.phase === 'placement');
	let isBattle = $derived(gameState.phase === 'battle');
	let myPlacementDone = $derived(myBoard?.placementDone ?? false);

	// Ships remaining to place
	let remainingShips = $derived(
		FLEET.filter(template => !placedShips.some(p => p.shipId === template.id))
	);
	let currentShipTemplate = $derived<ShipTemplate | undefined>(remainingShips[0]);
	let allShipsPlaced = $derived(placedShips.length === FLEET.length);

	// Preview cells during placement (based on hover)
	let previewCells = $derived.by(() => {
		if (!isPlacement || myPlacementDone || !currentShipTemplate || hoverCell === null) {
			return new Set<number>();
		}
		const { row, col } = fromIndex(hoverCell);
		const cells = new Set<number>();
		const size = currentShipTemplate.size;

		for (let i = 0; i < size; i++) {
			const r = orientation === 'vertical' ? row + i : row;
			const c = orientation === 'horizontal' ? col + i : col;
			if (r >= BOARD_SIZE || c >= BOARD_SIZE) return new Set<number>(); // out of bounds
			cells.add(toIndex(r, c));
		}

		// Check for overlap with already placed ships
		for (const cell of cells) {
			if (placementGrid[cell] === 'ship') return new Set<number>(); // overlap
		}

		return cells;
	});

	// Build a placement grid from locally placed ships
	let placementGrid = $derived.by(() => {
		const grid: OwnCell[] = Array(BOARD_SIZE * BOARD_SIZE).fill('empty');
		for (const placement of placedShips) {
			const template = FLEET.find(f => f.id === placement.shipId)!;
			const ship: Ship = {
				id: placement.shipId,
				name: template.name,
				size: template.size,
				row: placement.row,
				col: placement.col,
				orientation: placement.orientation,
				hits: []
			};
			for (const cellIdx of getShipCells(ship)) {
				grid[cellIdx] = 'ship';
			}
		}
		return grid;
	});

	// Battle phase: own grid (from server state)
	let myGrid = $derived(myBoard?.grid ?? Array(BOARD_SIZE * BOARD_SIZE).fill('empty'));

	// Battle phase: opponent grid (fog of war — from server sanitised state)
	let opponentGrid = $derived(opponentBoard?.grid ?? Array(BOARD_SIZE * BOARD_SIZE).fill('empty'));

	// Sunk cells for opponent grid display
	let opponentSunkCells = $derived.by(() => {
		const cells = new Set<number>();
		if (!opponentBoard) return cells;
		for (const ship of opponentBoard.ships) {
			if (isShipSunk(ship)) {
				for (const c of getShipCells(ship)) {
					cells.add(c);
				}
			}
		}
		return cells;
	});

	// Sunk cells on my board (incoming damage)
	let mySunkCells = $derived.by(() => {
		const cells = new Set<number>();
		if (!myBoard) return cells;
		for (const ship of myBoard.ships) {
			if (isShipSunk(ship)) {
				for (const c of getShipCells(ship)) {
					cells.add(c);
				}
			}
		}
		return cells;
	});

	// Ship counters for battle phase
	let myShipsRemaining = $derived(
		myBoard ? myBoard.ships.filter(s => !isShipSunk(s)).length : 0
	);
	let opponentShipsRemaining = $derived(
		opponentBoard ? FLEET.length - opponentBoard.ships.filter(s => isShipSunk(s)).length : FLEET.length
	);
	let myTotalShots = $derived(gameState.shots[userId]?.length ?? 0);

	// ─── Placement handlers ──────────────────────────────
	function handlePlacementClick(cell: number) {
		if (!currentShipTemplate || myPlacementDone) return;

		const { row, col } = fromIndex(cell);
		const size = currentShipTemplate.size;

		// Bounds check
		if (orientation === 'horizontal' && col + size > BOARD_SIZE) return;
		if (orientation === 'vertical' && row + size > BOARD_SIZE) return;

		// Overlap check
		const ship: Ship = {
			id: currentShipTemplate.id,
			name: currentShipTemplate.name,
			size,
			row,
			col,
			orientation,
			hits: []
		};
		for (const cellIdx of getShipCells(ship)) {
			if (placementGrid[cellIdx] === 'ship') return;
		}

		placedShips = [...placedShips, {
			shipId: currentShipTemplate.id,
			row,
			col,
			orientation
		}];
	}

	function handlePlacementRightClick(_cell: number) {
		toggleOrientation();
	}

	function toggleOrientation() {
		orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
	}

	function undoLastShip() {
		if (placedShips.length === 0) return;
		placedShips = placedShips.slice(0, -1);
	}

	function confirmPlacement() {
		if (!allShipsPlaced || disabled) return;
		onPlaceShips(placedShips);
	}

	// ─── Battle handlers ─────────────────────────────────
	function handleShoot(cell: number) {
		if (!isMyTurn || disabled) return;
		// Don't shoot cells already shot
		const opCell = opponentGrid[cell];
		if (opCell === 'hit' || opCell === 'miss') return;
		onShoot(cell);
	}

	// ─── Ship name lookup ────────────────────────────────
	function getShipName(shipId: string): string {
		const nameMap: Record<string, () => string> = {
			carrier: () => m.batalha_navio_porta_avioes(),
			battleship: () => m.batalha_navio_couraçado(),
			cruiser: () => m.batalha_navio_cruzador(),
			submarine: () => m.batalha_navio_submarino(),
			destroyer: () => m.batalha_navio_destroyer()
		};
		return nameMap[shipId]?.() ?? shipId;
	}
</script>

<div class="space-y-4">
	<!-- ═══════════ PLACEMENT PHASE ═══════════ -->
	{#if isPlacement && !myPlacementDone}
		<!-- Instructions -->
		<div class="space-y-2 text-center">
			<Badge variant="tertiary">
				{m.batalha_posicionar()}
			</Badge>
			<p class="font-body text-xs text-muted-foreground">
				{m.batalha_posicionar_desc()}
			</p>
		</div>

		<!-- Ship list — shows which ship is being placed -->
		<div class="flex flex-wrap items-center justify-center gap-2">
			{#each FLEET as template, i}
				{@const isPlaced = placedShips.some(p => p.shipId === template.id)}
				{@const isCurrent = currentShipTemplate?.id === template.id}
				<div
					class="flex items-center gap-1 border px-2 py-1 font-accent text-[10px] uppercase tracking-wider transition-all
						{isPlaced
							? 'border-accent/30 bg-accent/10 text-accent line-through opacity-60'
							: isCurrent
								? 'border-accent-tertiary/50 bg-accent-tertiary/10 text-accent-tertiary'
								: 'border-border/30 text-muted-foreground'}"
				>
					<Anchor class="h-3 w-3" strokeWidth={1.5} />
					{getShipName(template.id)}
					<span class="text-[9px] opacity-60">({template.size})</span>
				</div>
			{/each}
		</div>

		<!-- Orientation toggle -->
		<div class="flex items-center justify-center gap-3">
			<Button variant="outline" size="sm" onclick={toggleOrientation}>
				<RotateCw class="mr-1 h-4 w-4" strokeWidth={2} />
				{m.batalha_rodar()}
				<span class="ml-1 font-accent text-[10px] uppercase opacity-60">
					({orientation === 'horizontal' ? 'H' : 'V'})
				</span>
			</Button>
			{#if placedShips.length > 0}
				<Button variant="ghost" size="sm" onclick={undoLastShip}>
					{m.comum_voltar()}
				</Button>
			{/if}
		</div>

		<!-- Placement grid -->
		<BattleshipGrid
			grid={placementGrid}
			highlightCells={previewCells}
			interactive={!myPlacementDone && !!currentShipTemplate}
			onCellClick={handlePlacementClick}
			onCellRightClick={handlePlacementRightClick}
			label={m.batalha_tua_grelha()}
		/>

		<!-- Confirm button -->
		{#if allShipsPlaced}
			<div class="text-center">
				<Button variant="default" size="sm" onclick={confirmPlacement} {disabled}>
					<Check class="mr-1 h-4 w-4" strokeWidth={2} />
					{m.batalha_confirmar_posicao()}
				</Button>
			</div>
		{/if}

	<!-- ═══════════ WAITING FOR OPPONENT PLACEMENT ═══════════ -->
	{:else if isPlacement && myPlacementDone}
		<div class="space-y-4 text-center">
			<Badge variant="muted">
				<Clock class="mr-1 h-3 w-3 animate-spin" strokeWidth={2} />
				{m.batalha_a_esperar_adversario()}
			</Badge>

			<!-- Show own grid (read-only) -->
			<BattleshipGrid
				grid={myGrid}
				label={m.batalha_tua_grelha()}
			/>
		</div>

	<!-- ═══════════ BATTLE PHASE ═══════════ -->
	{:else if isBattle}
		<!-- Turn indicator -->
		<div class="flex items-center justify-center gap-3">
			{#if isMyTurn}
				<Badge variant="accent" glow>
					<Crosshair class="mr-1 h-3 w-3" strokeWidth={2} />
					{m.batalha_tua_vez()}
				</Badge>
			{:else}
				<Badge variant="muted">
					<Clock class="mr-1 h-3 w-3" strokeWidth={2} />
					{m.batalha_vez_adversario()}
				</Badge>
			{/if}
		</div>

		<!-- Last shot feedback -->
		{#if gameState.lastShot}
			{@const shot = gameState.lastShot}
			{@const isMyShot = shot.playerId === userId}
			<div class="text-center">
				<Badge
					variant={shot.result === 'miss' ? 'muted' : shot.result === 'sunk' ? 'destructive' : 'secondary'}
				>
					{#if shot.result === 'miss'}
						{m.batalha_agua()}
					{:else if shot.result === 'hit'}
						{m.batalha_acertou()}
					{:else if shot.result === 'sunk'}
						{m.batalha_afundado()} {shot.sunkShipId ? `(${getShipName(shot.sunkShipId)})` : ''}
					{/if}
				</Badge>
			</div>
		{/if}

		<!-- Stats bar -->
		<div class="flex items-center justify-between border border-border/30 bg-card/30 px-3 py-2 font-accent text-[10px] uppercase tracking-widest text-muted-foreground">
			<span>
				<ShipIcon class="mr-1 inline h-3 w-3" strokeWidth={1.5} />
				{myShipsRemaining}/{FLEET.length} {m.batalha_navios_restantes()}
			</span>
			<span>
				{myTotalShots} {m.batalha_disparos()}
			</span>
		</div>

		<!-- Grids — side by side on larger screens, stacked on mobile -->
		<div class="grid gap-4 lg:grid-cols-2">
			<!-- Own grid (read-only — shows incoming hits) -->
			<BattleshipGrid
				grid={myGrid}
				label={m.batalha_tua_grelha()}
				sunkCells={mySunkCells}
			/>

			<!-- Opponent grid (interactive — click to shoot) -->
			<BattleshipGrid
				grid={opponentGrid}
				interactive={isMyTurn && !disabled}
				onCellClick={handleShoot}
				label={m.batalha_grelha_adversario()}
				isOpponent={true}
				sunkCells={opponentSunkCells}
			/>
		</div>
	{/if}
</div>
