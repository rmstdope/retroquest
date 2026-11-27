/**
 * The browser specs stand in Elior's cottage by one shared walk (rq-t0ew), so a
 * change to how the game opens is made in one place.
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'

const E2E = new URL('./e2e/', import.meta.url)

/** The `.ts` files of `web/e2e` whose text matches `pattern`. */
function filesMatching(pattern: RegExp): string[] {
  return readdirSync(E2E)
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => pattern.test(readFileSync(new URL(file, E2E), 'utf8')))
}

describe('the walk to the cottage', () => {
  it('is written once, in the shared fixtures', () => {
    expect(filesMatching(/function toTheCottage\b/)).toEqual(['fixtures.ts'])
  })

  it('is the way every spec stands there, save those about the way itself', () => {
    // sceneSkip is about the change of scene on the way; roomTitle walks back into the dream's neighbours.
    expect(filesMatching(/'say hello to voice'/).sort()).toEqual([
      'fixtures.ts',
      'roomTitle.spec.ts',
      'sceneSkip.spec.ts',
    ])
  })
})
