import { describe, expect, it } from 'vitest'
import { narrationKey } from './narrationKey'
import { narrationWords, type NarrationManifest } from './narrationManifest'
import {
  chapterUnits,
  POPUP_NARRATION_ID,
  questPopUpUnits,
  turnUnits,
} from './narrationUnits'
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

describe('chapterUnits', () => {
  const body =
    'The wind rises.\n[dialogue]Come.[/dialogue]\n[event]Help.[/event]'
  const manifest = manifestOf(
    [NARRATOR, 'Act I: The Call'],
    [NARRATOR, 'The wind rises.'],
    ['writing', 'Come.'],
  )

  it('reads an intro as its heading, then each paragraph, leaving events silent', () => {
    const units = chapterUnits(
      { kind: 'intro', act: 'Act I', title: 'The Call', body },
      manifest,
    )
    expect(units.map((u) => u.parts.map((p) => !!p.clip))).toEqual([
      [true],
      [true],
      [true],
      [],
    ])
    expect(units[0].parts[0].markup).toBe('Act I: The Call')
  })

  it('shows a completion page title silently and reads its paragraphs', () => {
    const units = chapterUnits(
      { kind: 'complete', act: 'Act I', title: 'The Call', body },
      manifest,
    )
    expect(units[0].parts).toEqual([])
    expect(units.slice(1, 3).every((u) => u.parts[0].clip)).toBe(true)
  })

  it('gives a heading with no recording a part without a clip', () => {
    const units = chapterUnits(
      { kind: 'intro', act: 'Act I', title: 'The Call', body: '' },
      {},
    )
    expect(units).toEqual([
      { kind: 'block', parts: [{ markup: 'Act I: The Call', clip: null }] },
    ])
  })
})

describe('questPopUpUnits', () => {
  it('is one unit made of the completion text as the quest card reads it', () => {
    const text = 'You did it.\n[success]* Done[/success]'
    const manifest = manifestOf([NARRATOR, 'You did it.'], [NARRATOR, 'Done'])
    const units = questPopUpUnits(text, manifest)
    expect(units).toHaveLength(1)
    expect(units[0].kind).toBe('quest')
    expect(units[0].parts.map((p) => !!p.clip)).toEqual([true, true])
  })

  it('uses an id no story turn has', () => {
    expect(POPUP_NARRATION_ID).toBeLessThan(1)
  })
})
