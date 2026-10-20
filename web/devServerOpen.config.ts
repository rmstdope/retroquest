/**
 * Decides whether the Vite dev server opens the game page in a browser on
 * start. Only a person running `npm run dev` at a terminal wants that; agents,
 * fleet scripts and the end-to-end run start the server without a terminal
 * and must not pop a tab in the navigator's browser.
 */

/**
 * True when the dev server should open the page: standard output is a
 * terminal, `CI` is unset or empty, and `BROWSER` is not `none`.
 */
export function shouldOpenBrowser(
  env: Record<string, string | undefined>,
  stdoutIsTTY: boolean | undefined,
): boolean {
  if (stdoutIsTTY !== true) return false
  if (env.CI) return false
  return env.BROWSER?.toLowerCase() !== 'none'
}
