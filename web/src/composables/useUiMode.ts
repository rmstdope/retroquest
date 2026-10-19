/**
 * Which UI to show: the Lantern UI, or the classic UI with `?ui=classic`
 * (kept for one release after Lantern became the default).
 */
export type UiMode = 'lantern' | 'classic'

/** UI mode for a URL query string such as `?ui=classic`. */
export function uiModeFromSearch(search: string): UiMode {
  const ui = new URLSearchParams(search).get('ui')
  return ui?.toLowerCase() === 'classic' ? 'classic' : 'lantern'
}

/** UI mode for the current page. */
export function useUiMode(): UiMode {
  return uiModeFromSearch(window.location.search)
}
