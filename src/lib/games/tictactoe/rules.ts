// ─── Tic-Tac-Toe Game Rules ───────────────────────────────────
//
// Implements the GameRules interface for Tic-Tac-Toe.
// Pure functions — no side effects, no PocketBase dependency.
//

import type { GameRules } from '$lib/multiplayer/types';
import type { TicTacToeState, TicTacToeAction } from './types';
import { WINNING_LINES } from './types';

export const tictactoeRules: GameRules<TicTacToeState, TicTacToeAction> = {
	gameType: 'tictactoe',
	minPlayers: 2,
	maxPlayers: 2,

	createInitialState(playerIds: string[]): TicTacToeState {
		// First player is X, second is O
		return {
			board: Array(9).fill(null),
			symbols: {
				[playerIds[0]]: 'X',
				[playerIds[1]]: 'O'
			},
			moveCount: 0
		};
	},

	validateAction(
		state: TicTacToeState,
		_playerId: string,
		action: TicTacToeAction
	): { valid: boolean; error?: string } {
		if (action.type !== 'place') {
			return { valid: false, error: 'invalid_action_type' };
		}

		const { cell } = action;

		// Cell must be 0–8
		if (typeof cell !== 'number' || cell < 0 || cell > 8 || !Number.isInteger(cell)) {
			return { valid: false, error: 'invalid_cell' };
		}

		// Cell must be empty
		if (state.board[cell] !== null) {
			return { valid: false, error: 'cell_occupied' };
		}

		return { valid: true };
	},

	applyAction(
		state: TicTacToeState,
		playerId: string,
		action: TicTacToeAction
	): TicTacToeState {
		const newBoard = [...state.board];
		newBoard[action.cell] = playerId;

		return {
			...state,
			board: newBoard,
			moveCount: state.moveCount + 1
		};
	},

	checkWinner(state: TicTacToeState): {
		finished: boolean;
		winner?: string | null;
		isDraw?: boolean;
	} {
		// Check all winning lines
		for (const [a, b, c] of WINNING_LINES) {
			const cellA = state.board[a];
			if (cellA !== null && cellA === state.board[b] && cellA === state.board[c]) {
				return { finished: true, winner: cellA, isDraw: false };
			}
		}

		// Check for draw (all 9 cells filled, no winner)
		if (state.moveCount >= 9) {
			return { finished: true, winner: null, isDraw: true };
		}

		// Game continues
		return { finished: false };
	},

	getNextTurn(
		_state: TicTacToeState,
		currentPlayerId: string,
		playerIds: string[]
	): string {
		// Simple alternation
		return playerIds[0] === currentPlayerId ? playerIds[1] : playerIds[0];
	}

	// No sanitiseStateForPlayer needed — both players see the full board
};
