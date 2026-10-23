import { describe, expect, it } from 'vitest'
import { narrationKey } from './narrationKey'
import { narrationWords, type NarrationManifest } from './narrationManifest'
import { turnUnits } from './narrationUnits'
import { NARRATOR } from './narrationScript'

/** A manifest with a clip for each (speaker, markup) pair. */
function manifestOf(...lines: [string, string][]): NarrationManifest {
  const manifest: NarrationManifest = {}
  for (const [speaker, markup] of lines)
    manifest[narrationKey(speaker, markup)] = {
      file: 'x.mp3',
      speaker,
      duration: 1,
      words: narrationWords(markup).map((word, i) => ({
        word,
        start: i,
        end: i + 1,
      })),
    }
  return manifest
}

describe('turnUnits', () => {
  const text =
    'You speak with [character_name]Mira[/character_name].\n' +
    '[dialogue]Hello.[/dialogue]\n[event]Door.[/event]'
  const manifest = manifestOf(
    [NARRATOR, 'You speak with [character_name]Mira[/character_name].'],
    ['mira', 'Hello.'],
  )

  it('makes one unit per block, aligned with the story view, and voices only what has a clip', () => {
    const units = turnUnits({ text, arrival: null }, false, manifest)
    expect(units.map((unit) => unit.kind)).toEqual(['block', 'block', 'block'])
    expect(units.map((unit) => unit.parts.map((p) => !!p.clip))).toEqual([
      [true],
      [true],
      [],
    ])
  })

  it('gives a line with no recording a part without a clip', () => {
    const units = turnUnits(
      { text: 'Something new.', arrival: null },
      false,
      {},
    )
    expect(units).toEqual([
      { kind: 'block', parts: [{ markup: 'Something new.', clip: null }] },
    ])
  })

  it('reads the room description only on a first visit', () => {
    const arrival = { description: 'A low room.' }
    const withClip = manifestOf([NARRATOR, 'A low room.'])
    const turn = { text: 'You go north.', arrival }
    const first = turnUnits(turn, true, withClip)
    expect(first.at(-1)?.kind).toBe('arrival')
    expect(first.at(-1)?.parts[0].clip).not.toBeNull()
    const again = turnUnits(turn, false, withClip)
    expect(again.at(-1)?.kind).toBe('arrival')
    expect(again.at(-1)?.parts).toEqual([])
  })

  it('reads a new quest card as its text then each checklist item, and no other quest record', () => {
    const card = 'Find the key.\n[pending]* Look in the barn[/pending]'
    const clips = manifestOf(
      [NARRATOR, 'Find the key.'],
      [NARRATOR, 'Look in the barn'],
    )
    const quest = (kind: 'new' | 'updated') => ({
      kind,
      name: 'Key',
      main: true,
      text: card,
    })
    const units = turnUnits(
      { text: '', arrival: null, quests: [quest('new'), quest('updated')] },
      false,
      clips,
    )
    expect(units.map((u) => u.kind)).toEqual(['quest', 'quest'])
    expect(units[0].parts.map((p) => p.markup)).toEqual([
      'Find the key.',
      'Look in the barn',
    ])
    expect(units[0].parts.every((p) => p.clip)).toBe(true)
    expect(units[1].parts).toEqual([])
  })
})
