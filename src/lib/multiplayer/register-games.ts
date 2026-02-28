// ─── Game Rules Registration ──────────────────────────────────
//
// Registers all game rule implementations with the room engine.
// Called once at server startup (from hooks.server.ts).
//

import { registerGameRules } from '$lib/multiplayer/room-engine';
import { tictactoeRules } from '$lib/games/tictactoe';
import { battleshipRules } from '$lib/games/battleship';

let registered = false;

/**
 * Register all multiplayer game rules with the room engine.
 * Safe to call multiple times — only registers once.
 */
export function registerAllGameRules(): void {
	if (registered) return;

	registerGameRules(tictactoeRules);
	registerGameRules(battleshipRules);

	registered = true;
}
