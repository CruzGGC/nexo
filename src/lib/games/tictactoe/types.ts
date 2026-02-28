// ─── Tic-Tac-Toe Types ────────────────────────────────────────
//
// Shared types for Tic-Tac-Toe game state.
// Used by both the GameRules implementation (server) and UI (client).
//

/** Cell value: null = empty, string = userId who placed it */
export type TicTacToeCell = string | null;

/** 3×3 board — row-major order (9 cells) */
export type TicTacToeBoard = TicTacToeCell[];

/** Full game state stored in room.boardState */
export interface TicTacToeState {
	board: TicTacToeBoard;
	/** Maps userId → symbol ('X' or 'O') */
	symbols: Record<string, 'X' | 'O'>;
	/** Number of moves played */
	moveCount: number;
}

/** Action payload for a move */
export interface TicTacToeAction {
	type: 'place';
	/** Cell index 0–8 */
	cell: number;
}

/** All winning line combinations (indices into the 9-cell board) */
export const WINNING_LINES: readonly [number, number, number][] = [
	// Rows
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	// Columns
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	// Diagonals
	[0, 4, 8],
	[2, 4, 6]
] as const;
