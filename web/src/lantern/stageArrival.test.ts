import { describe, it, expect } from 'vitest'
import {
  ARRIVAL_MIN_SECONDS,
  arrivalParts,
  arrivesOnPicture,
  readingTimeMs,
} from './stageArrival'
import type { NarrationUnit } from './narrationUnits'

const room = { room: 'Square', description: 'Cobbles and a fountain.' }

describe('readingTimeMs', () => {
  it('reads about four words a second', () => {
    const words = Array.from({ length: 48 }, () => 'word').join(' ')
    expect(readingTimeMs(words)).toBe(12000)
  })

  it('never goes under six seconds', () => {
    expect(readingTimeMs('Short.')).toBe(ARRIVAL_MIN_SECONDS * 1000)
  })

  it('does not count markup tags as words', () => {
    expect(readingTimeMs('[bold]Short[/bold] one.')).toBe(6000)
  })
})

describe('arrivesOnPicture', () => {
  const first = { moved: true, firstVisit: true }
  it('is true for a narrated first visit', () => {
    expect(
      arrivesOnPicture({ narrate: true, description: first, arrival: room }),
    ).toBe(true)
  })

  it('is false for a revisit, a look and a load', () => {
    const turn = { narrate: true as const, arrival: room }
    expect(
      arrivesOnPicture({
        ...turn,
        description: { moved: true, firstVisit: false },
      }),
    ).toBe(false)
    expect(
      arrivesOnPicture({
        ...turn,
        description: { moved: false, firstVisit: false },
      }),
    ).toBe(false)
    expect(
      arrivesOnPicture({ arrival: room, description: first }), // a load is not narrated
    ).toBe(false)
  })

  it('is false when the turn has no room', () => {
    expect(
      arrivesOnPicture({ narrate: true, description: first, arrival: null }),
    ).toBe(false)
  })
})

describe('arrivalParts', () => {
  const silent: NarrationUnit = { kind: 'block', parts: [] }
  const voice: NarrationUnit = {
    kind: 'block',
    parts: [
      {
        markup: 'x',
        clip: { file: 'a', speaker: 'n', duration: 1, words: [] },
      },
    ],
  }

  it('is the description alone for a plain move', () => {
    const named: NarrationUnit = {
      kind: 'arrival',
      parts: [voice.parts[0], voice.parts[0]],
    }
    const parts = arrivalParts({ text: '', arrival: room }, [named])
    expect(parts).toEqual([
      {
        kind: 'description',
        lines: [{ unit: 0, markup: room.description, wordBase: 1 }],
        voiced: true,
      },
    ])
  })

  it('marks a speaker’s quote as joining the line before it', () => {
    const parts = arrivalParts(
      {
        text:
          '[character_name]Mira[/character_name] speaks.\n' +
          '[dialogue]Hello.[/dialogue]',
        arrival: null,
      },
      [],
    )
    expect(parts[0].lines.map((l) => l.joinsPrevious)).toEqual([
      undefined,
      true,
    ])
  })

  it('does not count the room name as the voice of the description', () => {
    const nameOnly: NarrationUnit = {
      kind: 'arrival',
      parts: [voice.parts[0], { markup: 'y', clip: null }],
    }
    const parts = arrivalParts({ text: '', arrival: room }, [nameOnly])
    expect(parts[0].voiced).toBe(false)
  })

  it('tells what happens on arrival first, then the description', () => {
    const parts = arrivalParts(
      { text: 'A man stands there.\n[event]He leaves.[/event]', arrival: room },
      [
        silent,
        silent,
        { kind: 'arrival', parts: [voice.parts[0], voice.parts[0]] },
      ],
    )
    expect(parts.map((part) => part.kind)).toEqual(['events', 'description'])
    expect(parts[0].lines.map((line) => line.unit)).toEqual([0, 1])
    expect(parts[0].voiced).toBe(false)
    expect(parts[1].lines[0].unit).toBe(2)
    expect(parts[1].voiced).toBe(true)
  })
})
