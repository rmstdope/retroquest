import { describe, expect, it } from 'vitest'
import { narrationKey } from './narrationKey'
import { narrationWords, type NarrationManifest } from './narrationManifest'
import {
  chapterUnits,
  POPUP_NARRATION_ID,
  SCENE_PAUSE_MS,
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

describe('turnUnits clue failures', () => {
  it('voices a clue failure, and leaves the echo and a plain refusal silent', () => {
    const text =
      '[event]You peer in.[/event]\n' +
      '[failure][clue]Something shiny.[/clue][/failure]\n' +
      '[failure]Nothing here.[/failure]'
    const units = turnUnits({ text, arrival: null }, false, {})
    expect(units.map((unit) => unit.parts.length)).toEqual([0, 1, 0])
    expect(units[1].parts[0].markup).toBe('Something shiny.')
  })
})

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

  it('reads the room’s name, then its description, only on a first visit', () => {
    const arrival = { room: 'Cellar', description: 'A low room.' }
    const withClip = manifestOf([NARRATOR, 'Cellar'], [NARRATOR, 'A low room.'])
    const turn = { text: 'You go north.', arrival }
    const first = turnUnits(turn, true, withClip)
    expect(first.at(-1)?.kind).toBe('arrival')
    expect(first.at(-1)?.parts.map((p) => p.markup)).toEqual([
      'Cellar',
      'A low room.',
    ])
    expect(first.at(-1)?.parts.every((p) => p.clip)).toBe(true)
    expect(first.at(-1)?.pauseBefore).toBe(SCENE_PAUSE_MS)
    expect(first.slice(0, -1).every((u) => !u.pauseBefore)).toBe(true)
    const again = turnUnits(turn, false, withClip)
    expect(again.at(-1)?.kind).toBe('arrival')
    expect(again.at(-1)?.parts).toEqual([])
  })

  it('reads a new quest card as its heading, name, text and each checklist item, and no other quest record', () => {
    const card = 'Find the key.\n[pending]* Look in the barn[/pending]'
    const clips = manifestOf(
      [NARRATOR, 'New main quest'],
      [NARRATOR, 'Key'],
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
      'New main quest',
      'Key',
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

  it('gives an intro’s first paragraph a breath after the heading, and no other unit', () => {
    const units = chapterUnits(
      { kind: 'intro', act: 'Act I', title: 'The Call', body },
      manifest,
    )
    expect(units.map((u) => u.pauseBefore ?? 0)).toEqual([
      0,
      SCENE_PAUSE_MS,
      0,
      0,
    ])
  })

  it('gives a closing page, whose title is not read, no breath', () => {
    const units = chapterUnits(
      { kind: 'complete', act: 'Act I', title: 'The Call', body },
      manifest,
    )
    expect(units.every((u) => !u.pauseBefore)).toBe(true)
  })

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

describe('a completed quest in the story', () => {
  it('is read as its heading, the quest’s name, then the completion text', () => {
    const text = 'You did it.\n[success]* Done[/success]'
    const manifest = manifestOf(
      [NARRATOR, 'Side quest complete'],
      [NARRATOR, 'Key'],
      [NARRATOR, 'You did it.'],
      [NARRATOR, 'Done'],
    )
    const units = turnUnits(
      {
        text: '',
        arrival: null,
        quests: [{ kind: 'completed', name: 'Key', main: false, text }],
      },
      false,
      manifest,
    )
    expect(units).toHaveLength(1)
    expect(units[0].kind).toBe('quest')
    expect(units[0].parts.map((p) => p.markup)).toEqual([
      'Side quest complete',
      'Key',
      'You did it.',
      'Done',
    ])
    expect(units[0].parts.every((p) => p.clip)).toBe(true)
  })
})

describe('POPUP_NARRATION_ID', () => {
  it('uses an id no story turn has', () => {
    expect(POPUP_NARRATION_ID).toBeLessThan(1)
  })
})
