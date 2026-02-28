// ─── Battleship Game Rules ────────────────────────────────────
//
// Implements the GameRules interface for Battleship.
// Two phases: placement (simultaneous) and battle (turn-based).
//
// Key design decisions:
// - Placement is simultaneous — both players place, then battle begins
//   when both are done. During placement, "turn" alternates but both
//   can submit. The room engine's turn check is bypassed by keeping
//   turn as '' during placement.
// - sanitiseStateForPlayer hides opponent's ship positions
//

import type { GameRules } from '$lib/multiplayer/types';
import type {
	BattleshipState,
	BattleshipAction,
	PlayerBoard,
	Ship,
	Orientation
} from './types';
import { FLEET, BOARD_SIZE, toIndex, getShipCells, isShipSunk } from './types';

export const battleshipRules: GameRules<BattleshipState, BattleshipAction> = {
	gameType: 'battleship',
	minPlayers: 2,
	maxPlayers: 2,

	createInitialState(playerIds: string[]): BattleshipState {
		const boards: Record<string, PlayerBoard> = {};
		const shots: Record<string, number[]> = {};

		for (const id of playerIds) {
			boards[id] = {
				grid: Array(BOARD_SIZE * BOARD_SIZE).fill('empty'),
				ships: [],
				placementDone: false
			};
			shots[id] = [];
		}

		return {
			phase: 'placement',
			boards,
			shots,
			lastShot: null
		};
	},

	validateAction(
		state: BattleshipState,
		playerId: string,
		action: BattleshipAction
	): { valid: boolean; error?: string } {
		if (action.type === 'place_ships') {
			return validatePlacement(state, playerId, action);
		}

		if (action.type === 'shoot') {
			return validateShot(state, playerId, action);
		}

		return { valid: false, error: 'invalid_action_type' };
	},

	applyAction(
		state: BattleshipState,
		playerId: string,
		action: BattleshipAction
	): BattleshipState {
		if (action.type === 'place_ships') {
			return applyPlacement(state, playerId, action);
		}

		if (action.type === 'shoot') {
			return applyShot(state, playerId, action);
		}

		return state;
	},

	checkWinner(state: BattleshipState): {
		finished: boolean;
		winner?: string | null;
		isDraw?: boolean;
	} {
		if (state.phase !== 'battle' && state.phase !== 'finished') {
			return { finished: false };
		}

		// Check if any player has all ships sunk
		for (const [playerId, board] of Object.entries(state.boards)) {
			if (board.ships.length > 0 && board.ships.every(s => isShipSunk(s))) {
				// This player lost — the other player wins
				const winnerId = Object.keys(state.boards).find(id => id !== playerId);
				return { finished: true, winner: winnerId ?? null, isDraw: false };
			}
		}

		return { finished: false };
	},

	getNextTurn(
		state: BattleshipState,
		currentPlayerId: string,
		playerIds: string[]
	): string {
		// During placement phase, no specific turn — return empty
		// (room engine handles this: turn='' means anyone can act)
		if (state.phase === 'placement') {
			return '';
		}

		// During battle: alternate turns
		return playerIds[0] === currentPlayerId ? playerIds[1] : playerIds[0];
	},

	/**
	 * Hide opponent's ship positions. Each player can only see:
	 * - Their own full board (ships + hits/misses)
	 * - Opponent's board with only hits/misses/sunk visible
	 */
	sanitiseStateForPlayer(state: BattleshipState, playerId: string): unknown {
		const sanitised: BattleshipState = {
			...state,
			boards: { ...state.boards }
		};

		// For each board, if it's not mine, hide ship positions
		for (const [boardOwner, board] of Object.entries(state.boards)) {
			if (boardOwner !== playerId) {
				// Create a fog-of-war grid — only show hits and misses
				const fogGrid = board.grid.map(cell => {
					if (cell === 'hit') return 'hit' as const;
					if (cell === 'miss') return 'miss' as const;
					return 'empty' as const; // Hide ships
				});

				// Show ships only if they're fully sunk
				const visibleShips = board.ships.filter(s => isShipSunk(s));

				sanitised.boards[boardOwner] = {
					...board,
					grid: fogGrid,
					ships: visibleShips
				};
			}
		}

		return sanitised;
	}
};

// ─── Validation helpers ───────────────────────────────────────

function validatePlacement(
	state: BattleshipState,
	playerId: string,
	action: { type: 'place_ships'; placements: Array<{ shipId: string; row: number; col: number; orientation: Orientation }> }
): { valid: boolean; error?: string } {
	if (state.phase !== 'placement') {
		return { valid: false, error: 'not_placement_phase' };
	}

	const board = state.boards[playerId];
	if (!board) {
		return { valid: false, error: 'no_board' };
	}

	if (board.placementDone) {
		return { valid: false, error: 'already_placed' };
	}

	const placements = action.placements;

	// Must place exactly the full fleet
	if (placements.length !== FLEET.length) {
		return { valid: false, error: 'wrong_ship_count' };
	}

	// Verify each ship is valid
	const usedShipIds = new Set<string>();
	const occupiedCells = new Set<number>();

	for (const placement of placements) {
		// Find the ship template
		const template = FLEET.find(f => f.id === placement.shipId);
		if (!template) {
			return { valid: false, error: `unknown_ship: ${placement.shipId}` };
		}

		// No duplicate ships
		if (usedShipIds.has(placement.shipId)) {
			return { valid: false, error: `duplicate_ship: ${placement.shipId}` };
		}
		usedShipIds.add(placement.shipId);

		// Check bounds
		const { row, col, orientation } = placement;
		if (row < 0 || col < 0) {
			return { valid: false, error: 'out_of_bounds' };
		}
		if (orientation === 'horizontal' && col + template.size > BOARD_SIZE) {
			return { valid: false, error: 'out_of_bounds' };
		}
		if (orientation === 'vertical' && row + template.size > BOARD_SIZE) {
			return { valid: false, error: 'out_of_bounds' };
		}

		// Check overlap
		const ship: Ship = {
			id: placement.shipId,
			name: template.name,
			size: template.size,
			row,
			col,
			orientation,
			hits: []
		};

		for (const cellIdx of getShipCells(ship)) {
			if (occupiedCells.has(cellIdx)) {
				return { valid: false, error: 'ships_overlap' };
			}
			occupiedCells.add(cellIdx);
		}
	}

	return { valid: true };
}

function validateShot(
	state: BattleshipState,
	playerId: string,
	action: { type: 'shoot'; cell: number }
): { valid: boolean; error?: string } {
	if (state.phase !== 'battle') {
		return { valid: false, error: 'not_battle_phase' };
	}

	const { cell } = action;

	if (typeof cell !== 'number' || cell < 0 || cell >= BOARD_SIZE * BOARD_SIZE || !Number.isInteger(cell)) {
		return { valid: false, error: 'invalid_cell' };
	}

	// Check if already shot there
	const myShots = state.shots[playerId] ?? [];
	if (myShots.includes(cell)) {
		return { valid: false, error: 'already_shot' };
	}

	return { valid: true };
}

// ─── Apply helpers ────────────────────────────────────────────

function applyPlacement(
	state: BattleshipState,
	playerId: string,
	action: { type: 'place_ships'; placements: Array<{ shipId: string; row: number; col: number; orientation: Orientation }> }
): BattleshipState {
	const newBoards = { ...state.boards };
	const board = { ...newBoards[playerId] };
	const newGrid = [...board.grid];
	const newShips: Ship[] = [];

	for (const placement of action.placements) {
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

		// Mark cells as 'ship' on the grid
		for (const cellIdx of getShipCells(ship)) {
			newGrid[cellIdx] = 'ship';
		}

		newShips.push(ship);
	}

	board.grid = newGrid;
	board.ships = newShips;
	board.placementDone = true;
	newBoards[playerId] = board;

	// Check if both players have placed — transition to battle
	const allPlaced = Object.values(newBoards).every(b => b.placementDone);

	return {
		...state,
		boards: newBoards,
		phase: allPlaced ? 'battle' : 'placement'
	};
}

function applyShot(
	state: BattleshipState,
	playerId: string,
	action: { type: 'shoot'; cell: number }
): BattleshipState {
	const { cell } = action;

	// Determine opponent
	const opponentId = Object.keys(state.boards).find(id => id !== playerId)!;
	const newBoards = { ...state.boards };
	const opponentBoard = { ...newBoards[opponentId] };
	const newGrid = [...opponentBoard.grid];
	const newShips = opponentBoard.ships.map(s => ({ ...s, hits: [...s.hits] }));

	// Record the shot
	const newShots = { ...state.shots };
	newShots[playerId] = [...(newShots[playerId] ?? []), cell];

	// Determine hit or miss
	let result: 'miss' | 'hit' | 'sunk' = 'miss';
	let sunkShipId: string | undefined;

	if (newGrid[cell] === 'ship') {
		// Hit!
		newGrid[cell] = 'hit';
		result = 'hit';

		// Find which ship was hit and record the hit
		for (const ship of newShips) {
			const shipCells = getShipCells(ship);
			const hitIndex = shipCells.indexOf(cell);
			if (hitIndex !== -1 && !ship.hits.includes(hitIndex)) {
				ship.hits.push(hitIndex);

				// Check if the ship is now sunk
				if (isShipSunk(ship)) {
					result = 'sunk';
					sunkShipId = ship.id;
				}
				break;
			}
		}
	} else {
		// Miss
		newGrid[cell] = 'miss';
	}

	opponentBoard.grid = newGrid;
	opponentBoard.ships = newShips;
	newBoards[opponentId] = opponentBoard;

	return {
		...state,
		boards: newBoards,
		shots: newShots,
		lastShot: { playerId, cell, result, sunkShipId }
	};
}
