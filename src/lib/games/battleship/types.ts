// ─── Battleship Types ─────────────────────────────────────────
//
// Shared types for Battleship game state.
// Board is 10×10. Each player has their own grid.
//

/** Cell state on a player's own board */
export type OwnCell = 'empty' | 'ship' | 'hit' | 'miss';

/** Cell state visible to the opponent (fog of war) */
export type OpponentCell = 'unknown' | 'hit' | 'miss' | 'sunk';

/** Ship orientation */
export type Orientation = 'horizontal' | 'vertical';

/** A placed ship */
export interface Ship {
	id: string;
	name: string;
	size: number;
	/** Top-left row (0–9) */
	row: number;
	/** Top-left col (0–9) */
	col: number;
	orientation: Orientation;
	/** Cells that have been hit (indices into the ship's length) */
	hits: number[];
}

/** Ship template for placement */
export interface ShipTemplate {
	id: string;
	name: string;
	size: number;
}

/** Standard fleet — 5 ships */
export const FLEET: readonly ShipTemplate[] = [
	{ id: 'carrier', name: 'Porta-aviões', size: 5 },
	{ id: 'battleship', name: 'Couraçado', size: 4 },
	{ id: 'cruiser', name: 'Cruzador', size: 3 },
	{ id: 'submarine', name: 'Submarino', size: 3 },
	{ id: 'destroyer', name: 'Destroyer', size: 2 }
] as const;

export const BOARD_SIZE = 10;

/** Per-player board state */
export interface PlayerBoard {
	/** 10×10 grid of own cell states (row-major, 100 cells) */
	grid: OwnCell[];
	/** Ships placed on this board */
	ships: Ship[];
	/** Whether placement is complete */
	placementDone: boolean;
}

/** Phases of a Battleship game */
export type BattleshipPhase = 'placement' | 'battle' | 'finished';

/** Full game state stored in room.boardState */
export interface BattleshipState {
	phase: BattleshipPhase;
	/** Keyed by userId */
	boards: Record<string, PlayerBoard>;
	/** Shots taken by each player — array of cell indices on the opponent's grid */
	shots: Record<string, number[]>;
	/** Last shot result for UI feedback */
	lastShot: {
		playerId: string;
		cell: number;
		result: 'miss' | 'hit' | 'sunk';
		sunkShipId?: string;
	} | null;
}

/** Action types */
export interface BattleshipPlaceAction {
	type: 'place_ships';
	placements: Array<{
		shipId: string;
		row: number;
		col: number;
		orientation: Orientation;
	}>;
}

export interface BattleshipShootAction {
	type: 'shoot';
	cell: number; // 0–99 index on opponent's grid
}

export type BattleshipAction = BattleshipPlaceAction | BattleshipShootAction;

// ─── Helpers ──────────────────────────────────────────────────

/** Convert row, col to flat index */
export function toIndex(row: number, col: number): number {
	return row * BOARD_SIZE + col;
}

/** Convert flat index to row, col */
export function fromIndex(index: number): { row: number; col: number } {
	return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

/** Get all cell indices occupied by a ship */
export function getShipCells(ship: Ship): number[] {
	const cells: number[] = [];
	for (let i = 0; i < ship.size; i++) {
		const row = ship.orientation === 'vertical' ? ship.row + i : ship.row;
		const col = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
		cells.push(toIndex(row, col));
	}
	return cells;
}

/** Check if a ship is fully sunk */
export function isShipSunk(ship: Ship): boolean {
	return ship.hits.length >= ship.size;
}
