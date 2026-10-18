/**
 * Which UI to show: the new Lantern UI while it is being built
 * (`?ui=lantern`), otherwise the classic UI.
 */
export type UiMode = 'lantern' | 'classic'

/** UI mode for a URL query string such as `?ui=lantern`. */
export function uiModeFromSearch(search: string): UiMode {
  const ui = new URLSearchParams(search).get('ui')
  return ui?.toLowerCase() === 'lantern' ? 'lantern' : 'classic'
}

/** UI mode for the current page. */
export function useUiMode(): UiMode {
  return uiModeFromSearch(window.location.search)
}
