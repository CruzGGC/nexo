/**
 * Wordsearch module — public API
 */
export type {
	WordDirection,
	WordPlacement,
	WordsearchPuzzle,
	WordsearchPuzzleClient,
	WordsearchWordClient,
	WordsearchSelection,
	WordsearchGameState,
	WordsearchGeneratorConfig,
	CellPosition
} from './types';

export {
	generateWordsearch,
	toClientPuzzle,
	getDailySeed,
	validateSelection,
	DIFFICULTY_PRESETS
} from './generator';
