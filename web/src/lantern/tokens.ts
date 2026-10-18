/**
 * Lantern design tokens: the single source of truth for the new web UI's
 * colours and text scale. `lantern.css` mirrors the palettes as CSS
 * variables (`--lq-*`); a unit test keeps the two in sync and checks that
 * every text colour meets WCAG AA contrast on the backgrounds it is used on.
 *
 * Chosen on the design canvas: Lantern look, bold amber, compact spacing,
 * tight type, dark ink and warm-paper light themes.
 */

export interface LanternPalette {
  /** Page background. */
  bg: string
  /** Cards, sheets and panels. */
  surface: string
  /** Raised controls (selected segments, slot cards). */
  raised: string
  /** Hairlines and dividers. */
  line: string
  /** Stronger borders (inputs, empty slots). */
  line2: string
  /** UI text and headings. */
  fg: string
  /** Story prose. */
  prose: string
  /** Secondary text, hints, captions. */
  muted: string
  /** Amber fill for primary buttons and progress. */
  accent: string
  /** Text drawn on an accent fill. */
  onAccent: string
  /** Amber text and links. */
  accentText: string
  /** Tinted amber background (exits, quest records). */
  accentSoft: string
  /** Amber border. */
  accentLine: string
  /** Failed actions ("not like that"): soft rust. */
  failure: string
  failureSoft: string
  /** Completed checklist items. */
  success: string
  character: string
  characterSoft: string
  characterLine: string
  item: string
  itemSoft: string
  itemLine: string
  spell: string
  spellSoft: string
  spellLine: string
}

export type LanternTheme = 'dark' | 'light'

export const LANTERN_PALETTES: Readonly<Record<LanternTheme, LanternPalette>> =
  {
    dark: {
      bg: '#10151a',
      surface: '#161d24',
      raised: '#1c242c',
      line: '#26313b',
      line2: '#34404b',
      fg: '#ece6d6',
      prose: '#d9d3c3',
      muted: '#a39d8e',
      accent: '#ffa914',
      onAccent: '#1a1408',
      accentText: '#ffb836',
      accentSoft: '#36270a',
      accentLine: '#a8740f',
      failure: '#e8896b',
      failureSoft: '#2a1814',
      success: '#8fcf7a',
      character: '#7fb0e6',
      characterSoft: '#172433',
      characterLine: '#34506b',
      item: '#8fcf7a',
      itemSoft: '#18261b',
      itemLine: '#355236',
      spell: '#c79bf0',
      spellSoft: '#241a33',
      spellLine: '#4a3866',
    },
    light: {
      bg: '#f5f0e6',
      surface: '#fffcf5',
      raised: '#efe8da',
      line: '#e2d9c6',
      line2: '#cfc4ad',
      fg: '#22201b',
      prose: '#36322a',
      muted: '#6b6455',
      accent: '#f29e00',
      onAccent: '#1a1408',
      accentText: '#7a4300',
      accentSoft: '#ffe0a0',
      accentLine: '#eba526',
      failure: '#a63d1f',
      failureSoft: '#fbe9e2',
      success: '#2e6e27',
      character: '#2a5d9f',
      characterSoft: '#e3edf9',
      characterLine: '#a9c3e6',
      item: '#2e6e27',
      itemSoft: '#e4f2df',
      itemLine: '#a9d29e',
      spell: '#6b35a3',
      spellSoft: '#efe5f9',
      spellLine: '#c9ade6',
    },
  }

/** Story-text multipliers for the player's Small / Medium / Large setting. */
export const LANTERN_TEXT_SCALE = {
  small: 0.88,
  medium: 1,
  large: 1.18,
} as const

export type LanternTextSize = keyof typeof LANTERN_TEXT_SCALE

/** CSS custom property for a palette key, e.g. `accentText` → `--lq-accent-text`. */
export function cssVariableName(key: string): string {
  return `--lq-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
}

/** Relative luminance of a `#rrggbb` colour (WCAG 2.x). */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two `#rrggbb` colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
