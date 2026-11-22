import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * `BeltFace` has several roots (the fading-out picture beside the main one),
 * and Vue gives a parent's scoped-style id to a child's single root only. So a
 * parent must write the rules for the picture class it passes in as `:deep(...)`,
 * or the rule stops matching and the picture shows at its natural size.
 */
const PARENTS: Record<string, string[]> = {
  'BeltOfPictures.vue': ['lq-belt-face'],
  'DragGhost.vue': ['lq-drag-face'],
  'HandStrip.vue': ['lq-hand-ghost-face'],
  'AcquiredFlight.vue': [
    'lq-flight-pic',
    'lq-flight-face',
    'lq-flight-face-item',
    'lq-flight-face-spell',
  ],
}

describe('pictures shown through BeltFace', () => {
  for (const [file, classes] of Object.entries(PARENTS)) {
    for (const cls of classes) {
      it(`${file} styles .${cls} through :deep`, () => {
        const source = readFileSync(
          new URL(`./${file}`, import.meta.url),
          'utf8',
        )
        const style = source.slice(source.indexOf('<style'))
        expect(style).toContain(`:deep(.${cls})`)
        expect(style).not.toMatch(
          new RegExp(`(^|[\\s,>])\\.${cls}\\s*[{,]`, 'm'),
        )
      })
    }
  }
})
