import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import {
  LANTERN_PALETTES,
  LANTERN_TEXT_SCALE,
  contrastRatio,
  cssVariableName,
  type LanternPalette,
} from './tokens'
import { THEME_TAGS } from '@/utils/theme'

// Read from disk: Vitest replaces CSS imports (even ?raw) with empty strings.
const lanternCss = readFileSync(
  new URL('./lantern.css', import.meta.url),
  'utf8',
)

/** WCAG AA minimum contrast for normal-size text. */
const AA_TEXT = 4.5

/** Text colours and the backgrounds they are drawn on in the Lantern design. */
function textPairs(p: LanternPalette): Array<[string, string, string]> {
  const pairs: Array<[string, string, string]> = []
  for (const bg of ['bg', 'surface', 'raised'] as const) {
    for (const fg of [
      'fg',
      'prose',
      'muted',
      'accentText',
      'failure',
      'success',
    ] as const) {
      pairs.push([`${fg} on ${bg}`, p[fg], p[bg]])
    }
  }
  // Quest cards (with their prose), quick-save buttons and exits sit on the
  // amber tint.
  for (const fg of ['fg', 'prose', 'muted', 'accentText'] as const) {
    pairs.push([`${fg} on accentSoft`, p[fg], p.accentSoft])
  }
  pairs.push(['success on itemSoft', p.success, p.itemSoft])
  pairs.push(['onAccent on accent', p.onAccent, p.accent])
  pairs.push(['failure on failureSoft', p.failure, p.failureSoft])
  for (const kind of ['character', 'item', 'spell'] as const) {
    pairs.push([`${kind} on ${kind}Soft`, p[kind], p[`${kind}Soft`]])
    pairs.push([`${kind} on surface`, p[kind], p.surface])
    // Inline names in the story and inside failure boxes.
    pairs.push([`${kind} on bg`, p[kind], p.bg])
    pairs.push([`${kind} on failureSoft`, p[kind], p.failureSoft])
    // Chip notes ("to Bag") are muted text inside entity chips.
    pairs.push([`muted on ${kind}Soft`, p.muted, p[`${kind}Soft`]])
  }
  return pairs
}

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for equal colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })

  it('does not depend on argument order', () => {
    expect(contrastRatio('#10151a', '#ece6d6')).toBeCloseTo(
      contrastRatio('#ece6d6', '#10151a'),
      10,
    )
  })
})

describe('Lantern palettes', () => {
  for (const theme of ['dark', 'light'] as const) {
    describe(theme, () => {
      it.each(textPairs(LANTERN_PALETTES[theme]))(
        '%s meets WCAG AA',
        (_label, fg, bg) => {
          expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT)
        },
      )
    })
  }

  it('dark and light define the same tokens', () => {
    expect(Object.keys(LANTERN_PALETTES.light).sort()).toEqual(
      Object.keys(LANTERN_PALETTES.dark).sort(),
    )
  })
})

describe('Lantern text scale', () => {
  it('maps Small/Medium/Large to the chosen multipliers', () => {
    expect(LANTERN_TEXT_SCALE).toEqual({ small: 0.88, medium: 1, large: 1.18 })
  })
})

describe('lantern.css', () => {
  /** Return the `--name: value` declarations inside the first rule matching selector. */
  function declarations(selector: string): Record<string, string> {
    const start = lanternCss.indexOf(`${selector} {`)
    expect(start, `rule ${selector} missing`).toBeGreaterThanOrEqual(0)
    const body = lanternCss.slice(start, lanternCss.indexOf('}', start))
    return Object.fromEntries(
      [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
        m[1],
        m[2].trim(),
      ]),
    )
  }

  it.each([
    ['dark', ":root[data-ui='lantern']"],
    ['light', ":root[data-ui='lantern']:not([data-theme='dark'])"],
    ['light', ":root[data-ui='lantern'][data-theme='light']"],
  ] as const)('the %s rule %s matches tokens.ts exactly', (theme, selector) => {
    const expected = Object.fromEntries(
      Object.entries(LANTERN_PALETTES[theme]).map(([k, v]) => [
        cssVariableName(k),
        v,
      ]),
    )
    const actual = declarations(selector)
    for (const [name, value] of Object.entries(expected)) {
      expect(actual[name], name).toBe(value)
    }
  })

  it('follows a light device preference unless dark is chosen explicitly', () => {
    expect(lanternCss).toContain('@media (prefers-color-scheme: light)')
    expect(lanternCss).toContain(
      ":root[data-ui='lantern']:not([data-theme='dark'])",
    )
  })

  it('reduces motion when chosen, or when the device asks unless turned off', () => {
    expect(declarations(":root[data-ui='lantern']")['--lq-motion']).toBe('1')
    expect(
      declarations(":root[data-ui='lantern'][data-reduce-motion='on']")[
        '--lq-motion'
      ],
    ).toBe('0')
    expect(lanternCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(
      declarations(":root[data-ui='lantern']:not([data-reduce-motion='off'])")[
        '--lq-motion'
      ],
    ).toBe('0')
  })

  it.each(THEME_TAGS)(
    'styles the inline [%s] tag for the Lantern look',
    (tag) => {
      expect(lanternCss).toContain(`:root[data-ui='lantern'] .theme-${tag}`)
    },
  )

  it('bundles a prose face for every weight the inline tags use, upright and italic', () => {
    // Tags sit in prose and in italic dialogue; a missing face makes the browser
    // fake the bold, which smears the text.
    const weights = new Set(
      [...lanternCss.matchAll(/\.theme-\w+ \{[^}]*font-weight: (\d+)/g)].map(
        (m) => m[1],
      ),
    )
    expect(weights.size).toBeGreaterThan(0)
    for (const weight of weights) {
      for (const face of [weight, `${weight}-italic`]) {
        expect(lanternCss).toContain(
          `@import '@fontsource/source-serif-4/${face}.css'`,
        )
      }
    }
  })
})
