/**
 * The name of the game, declared once. Every screen and message that names
 * the game builds on these; `index.html` and `public/manifest.json` cannot
 * import them, so `lantern/gameName.test.ts` compares them with these values.
 */

/** The short name: the wordmark, the loading heading and the sentences that name the game. */
export const GAME_NAME = 'Tales of Twinmoor'

/** The subtitle that follows the short name in the full name. */
export const GAME_SUBTITLE = 'Wardens of the Dawn'

/** The full name: the browser tab, the installed app and the title page for screen readers. */
export const GAME_FULL_NAME = `${GAME_NAME}: ${GAME_SUBTITLE}`
