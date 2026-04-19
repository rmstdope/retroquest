/**
 * Theme rendering: converts engine markup tags to styled HTML spans.
 *
 * The Python engine outputs strings with Rich-style markup like
 * [character_name]Mira[/character_name]. This module converts those
 * to <span class="theme-character_name">Mira</span> for CSS styling.
 *
 * Regexes are compiled once at module load time for performance.
 */

/** All known theme tags from engine/theme.py. */
export const THEME_TAGS: readonly string[] = [
  'character_name',
  'dialogue',
  'item_name',
  'spell_name',
  'room_name',
  'quest_name',
  'event',
  'failure',
  'success',
  'exits',
  'bold',
  'dim',
] as const

/** Pre-compiled regex pairs for each tag: [openRegex, closeRegex, cssClass]. */
const TAG_PATTERNS: Array<[RegExp, RegExp, string]> = THEME_TAGS.map((tag) => [
  new RegExp(`\\[${tag}\\]`, 'g'),
  new RegExp(`\\[/${tag}\\]`, 'g'),
  `theme-${tag}`,
])

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Convert engine markup tags to HTML spans with CSS classes.
 *
 * First escapes raw HTML, then replaces [tag]...[/tag] pairs with
 * <span class="theme-tag">...</span>. Converts newlines to <br>.
 */
export function renderMarkup(text: string): string {
  if (!text) return ''

  let html = escapeHtml(text)

  for (const [openRegex, closeRegex, cssClass] of TAG_PATTERNS) {
    html = html.replace(openRegex, `<span class="${cssClass}">`)
    html = html.replace(closeRegex, '</span>')
  }

  html = html.replace(/\n/g, '<br>')

  return html
}
