import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Every non-test TypeScript source under a directory of this act. */
function sources(dir: string): string[] {
  return readdirSync(join(__dirname, dir))
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => readFileSync(join(__dirname, dir, f), 'utf8'))
}

describe('Act II completed flags', () => {
  it('are raised by the engine, never by hand in characters, items or quests', () => {
    const hand = /setStoryFlag\(\s*FLAG_\w+_COMPLETED\b/
    const offenders = ['.', 'characters', 'items', 'quests', 'rooms', 'spells']
      .flatMap(sources)
      .filter((text) => hand.test(text))
    expect(offenders).toEqual([])
  })
})
