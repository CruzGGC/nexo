// ─── Battleship module barrel export ──────────────────────────

export { battleshipRules } from './rules';
export type {
	BattleshipState,
	BattleshipAction,
	BattleshipPlaceAction,
	BattleshipShootAction,
	BattleshipPhase,
	PlayerBoard,
	Ship,
	ShipTemplate,
	OwnCell,
	OpponentCell,
	Orientation
} from './types';
export { FLEET, BOARD_SIZE, toIndex, fromIndex, getShipCells, isShipSunk } from './types';
