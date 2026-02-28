/**
 * Crossword module — public API
 */
export type {
	Direction,
	CrosswordEntry,
	CrosswordPuzzle,
	CrosswordPuzzleClient,
	CrosswordClueClient,
	CellPosition,
	CrosswordGameState,
	WordBankEntry,
	GeneratorConfig
} from './types';

export {
	generateCrossword,
	toClientPuzzle,
	getDailySeed,
	validateAnswer,
	DIFFICULTY_PRESETS
} from './generator';
