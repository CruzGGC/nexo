/**
 * Portuguese (PT-PT) word bank for wordsearch puzzles.
 * Separate from crossword words — uses shorter display-friendly words
 * with optional category hints.
 */

export interface WordsearchEntry {
	/** Word for the grid (uppercase, no diacritics) */
	word: string;
	/** Display word (for the word list panel) */
	display: string;
	/** Optional hint/category */
	hint?: string;
	difficulty: 'easy' | 'medium' | 'hard';
}

export const wordsearchBank: WordsearchEntry[] = [
	// ─── Easy (3-5 letters) ─────────────────────────────
	{ word: 'SOL', display: 'Sol', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'MAR', display: 'Mar', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'LUA', display: 'Lua', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'RIO', display: 'Rio', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'PAZ', display: 'Paz', difficulty: 'easy' },
	{ word: 'REI', display: 'Rei', difficulty: 'easy' },
	{ word: 'AVE', display: 'Ave', hint: 'Animais', difficulty: 'easy' },
	{ word: 'OVO', display: 'Ovo', hint: 'Comida', difficulty: 'easy' },
	{ word: 'COR', display: 'Cor', difficulty: 'easy' },
	{ word: 'LUZ', display: 'Luz', difficulty: 'easy' },
	{ word: 'CEU', display: 'Céu', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'MEL', display: 'Mel', hint: 'Comida', difficulty: 'easy' },
	{ word: 'SAL', display: 'Sal', hint: 'Comida', difficulty: 'easy' },
	{ word: 'CAO', display: 'Cão', hint: 'Animais', difficulty: 'easy' },
	{ word: 'PAO', display: 'Pão', hint: 'Comida', difficulty: 'easy' },
	{ word: 'FIM', display: 'Fim', difficulty: 'easy' },
	{ word: 'VOZ', display: 'Voz', difficulty: 'easy' },
	{ word: 'MAE', display: 'Mãe', hint: 'Família', difficulty: 'easy' },
	{ word: 'PAI', display: 'Pai', hint: 'Família', difficulty: 'easy' },
	{ word: 'DIA', display: 'Dia', hint: 'Tempo', difficulty: 'easy' },
	{ word: 'CASA', display: 'Casa', difficulty: 'easy' },
	{ word: 'GATO', display: 'Gato', hint: 'Animais', difficulty: 'easy' },
	{ word: 'FOGO', display: 'Fogo', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'VIDA', display: 'Vida', difficulty: 'easy' },
	{ word: 'AMOR', display: 'Amor', difficulty: 'easy' },
	{ word: 'NEVE', display: 'Neve', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'ONDA', display: 'Onda', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'ROSA', display: 'Rosa', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'MAPA', display: 'Mapa', difficulty: 'easy' },
	{ word: 'JOGO', display: 'Jogo', difficulty: 'easy' },
	{ word: 'BOLA', display: 'Bola', hint: 'Desporto', difficulty: 'easy' },
	{ word: 'REDE', display: 'Rede', difficulty: 'easy' },
	{ word: 'ILHA', display: 'Ilha', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'LAGO', display: 'Lago', hint: 'Natureza', difficulty: 'easy' },
	{ word: 'LOBO', display: 'Lobo', hint: 'Animais', difficulty: 'easy' },
	{ word: 'MESA', display: 'Mesa', difficulty: 'easy' },
	{ word: 'OURO', display: 'Ouro', difficulty: 'easy' },
	{ word: 'VELA', display: 'Vela', difficulty: 'easy' },
	{ word: 'ARCO', display: 'Arco', difficulty: 'easy' },
	{ word: 'PATO', display: 'Pato', hint: 'Animais', difficulty: 'easy' },
	{ word: 'NOTA', display: 'Nota', difficulty: 'easy' },
	{ word: 'NEXO', display: 'Nexo', difficulty: 'easy' },

	// ─── Medium (5-7 letters) ───────────────────────────
	{ word: 'NOITE', display: 'Noite', hint: 'Tempo', difficulty: 'medium' },
	{ word: 'PORTA', display: 'Porta', difficulty: 'medium' },
	{ word: 'LIVRO', display: 'Livro', hint: 'Cultura', difficulty: 'medium' },
	{ word: 'PRAIA', display: 'Praia', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'TERRA', display: 'Terra', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'VERDE', display: 'Verde', hint: 'Cores', difficulty: 'medium' },
	{ word: 'PEDRA', display: 'Pedra', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'NAVIO', display: 'Navio', difficulty: 'medium' },
	{ word: 'TIGRE', display: 'Tigre', hint: 'Animais', difficulty: 'medium' },
	{ word: 'OCEANO', display: 'Oceano', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'JARDIM', display: 'Jardim', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'SONHO', display: 'Sonho', difficulty: 'medium' },
	{ word: 'NUVEM', display: 'Nuvem', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'PONTE', display: 'Ponte', difficulty: 'medium' },
	{ word: 'ARENA', display: 'Arena', difficulty: 'medium' },
	{ word: 'FAROL', display: 'Farol', difficulty: 'medium' },
	{ word: 'LENDA', display: 'Lenda', hint: 'Cultura', difficulty: 'medium' },
	{ word: 'RAINHA', display: 'Rainha', difficulty: 'medium' },
	{ word: 'COROA', display: 'Coroa', difficulty: 'medium' },
	{ word: 'TRONO', display: 'Trono', difficulty: 'medium' },
	{ word: 'MUSEU', display: 'Museu', hint: 'Cultura', difficulty: 'medium' },
	{ word: 'ENIGMA', display: 'Enigma', difficulty: 'medium' },
	{ word: 'ESPADA', display: 'Espada', hint: 'História', difficulty: 'medium' },
	{ word: 'PIRATA', display: 'Pirata', difficulty: 'medium' },
	{ word: 'MAGIA', display: 'Magia', difficulty: 'medium' },
	{ word: 'SELVA', display: 'Selva', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'CHAVE', display: 'Chave', difficulty: 'medium' },
	{ word: 'CAMPO', display: 'Campo', hint: 'Natureza', difficulty: 'medium' },
	{ word: 'DUELO', display: 'Duelo', difficulty: 'medium' },
	{ word: 'ATLAS', display: 'Atlas', hint: 'Cultura', difficulty: 'medium' },
	{ word: 'FADO', display: 'Fado', hint: 'Portugal', difficulty: 'medium' },
	{ word: 'TEJO', display: 'Tejo', hint: 'Portugal', difficulty: 'medium' },
	{ word: 'DOURO', display: 'Douro', hint: 'Portugal', difficulty: 'medium' },
	{ word: 'PORTO', display: 'Porto', hint: 'Portugal', difficulty: 'medium' },

	// ─── Hard (7-10 letters) ────────────────────────────
	{ word: 'CASTELO', display: 'Castelo', hint: 'História', difficulty: 'hard' },
	{ word: 'FLORESTA', display: 'Floresta', hint: 'Natureza', difficulty: 'hard' },
	{ word: 'TESOURO', display: 'Tesouro', difficulty: 'hard' },
	{ word: 'DRAGAO', display: 'Dragão', hint: 'Fantasia', difficulty: 'hard' },
	{ word: 'PLANETA', display: 'Planeta', hint: 'Ciência', difficulty: 'hard' },
	{ word: 'COMETA', display: 'Cometa', hint: 'Ciência', difficulty: 'hard' },
	{ word: 'CAVALEIRO', display: 'Cavaleiro', hint: 'História', difficulty: 'hard' },
	{ word: 'AVENTURA', display: 'Aventura', difficulty: 'hard' },
	{ word: 'UNIVERSO', display: 'Universo', hint: 'Ciência', difficulty: 'hard' },
	{ word: 'ECLIPSE', display: 'Eclipse', hint: 'Ciência', difficulty: 'hard' },
	{ word: 'AZULEJO', display: 'Azulejo', hint: 'Portugal', difficulty: 'hard' },
	{ word: 'BACALHAU', display: 'Bacalhau', hint: 'Portugal', difficulty: 'hard' },
	{ word: 'GUITARRA', display: 'Guitarra', hint: 'Portugal', difficulty: 'hard' },
	{ word: 'CARAVELA', display: 'Caravela', hint: 'Portugal', difficulty: 'hard' },
	{ word: 'SAUDADE', display: 'Saudade', hint: 'Portugal', difficulty: 'hard' },
	{ word: 'ALGARVE', display: 'Algarve', hint: 'Portugal', difficulty: 'hard' },
	{ word: 'HORIZONTE', display: 'Horizonte', hint: 'Natureza', difficulty: 'hard' },
	{ word: 'LABIRINTO', display: 'Labirinto', difficulty: 'hard' },
	{ word: 'BORBOLETA', display: 'Borboleta', hint: 'Natureza', difficulty: 'hard' },
	{ word: 'FORTALEZA', display: 'Fortaleza', hint: 'História', difficulty: 'hard' },
];
