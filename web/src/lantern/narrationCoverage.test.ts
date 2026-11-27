/**
 * Act I's stock replies in its narration script (`tts/act1/script.json`): each
 * give refusal is there once, whatever item was offered, and no stock reply
 * names the item or the typed word.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ScriptLine } from './narrationScript'

/** Reads a JSON file of the repository relative to `web/`. */
function readJson<T>(path: string): T {
  return JSON.parse(
    readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'),
  ) as T
}

describe('Act I stock replies in the script (rq-bio)', () => {
  const script = readJson<ScriptLine[]>('tts/act1/script.json')

  it('holds each give refusal once, whatever item was offered', () => {
    for (const opening of [
      'Tilda looks it over',
      'The priest shakes his head and',
      'The deer sniffs at it',
      'Grandmother turns it over',
      'Mira regards it',
      'Borin gives it a glance',
      'The fisherman eyes it',
      'The merchant weighs it',
      'Patches sniffs at your offering',
    ]) {
      expect(
        script.filter((line) => line.text.startsWith(opening)),
        opening,
      ).toHaveLength(1)
    }
  })

  it('no longer holds a stock reply that names the item or the typed word', () => {
    const echoes = script.filter((line) =>
      /doesn't seem interested in the|to sell right now|You don't see any|looks at the (bread|faded|rusty)|examines the|curiously but/.test(
        line.text,
      ),
    )
    expect(echoes).toEqual([])
  })
})
