import { describe, expect, it } from 'vitest'
import { columnPieces } from './columnPieces'
import { parseTurn } from './parseTurn'
import type { Turn } from '@/stores/useGameStore'

function turn(text: string, extra: Partial<Turn> = {}): Turn {
  return {
    id: 1,
    command: 'talk to mira',
    text,
    room: 'Cottage',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
    addressed: 'Mira',
    ...extra,
  }
}

const say = (name: string, words: string): string =>
  `[character_name]${name}[/character_name]\n[dialogue]${words}[/dialogue]`

function kinds(t: Turn): string[] {
  return columnPieces(t, parseTurn(t.text)).map((p) =>
    p.kind === 'line' ? `line:${p.line.speaker}` : 'card',
  )
}

describe('columnPieces', () => {
  it('puts the narrator between the lines where it happened', () => {
    const t = turn(
      `${say('Mira', 'Hello.')}\nShe smiles.\n${say('Mira', 'Again.')}`,
    )
    expect(kinds(t)).toEqual(['card', 'line:Mira', 'card', 'line:Mira'])
  })

  it('starts with a slim command-only card when the turn begins with speech', () => {
    const t = turn(say('Mira', 'Hello.'))
    const pieces = columnPieces(t, parseTurn(t.text))
    expect(pieces[0]).toMatchObject({
      kind: 'card',
      blocks: [],
      command: true,
    })
    expect(pieces).toHaveLength(2)
  })

  it('puts the command on the first narrator piece when the turn begins with narration', () => {
    const t = turn(`She waves.\n${say('Mira', 'Hello.')}`)
    const pieces = columnPieces(t, parseTurn(t.text))
    expect(pieces[0]).toMatchObject({ kind: 'card', command: true })
    expect(pieces.filter((p) => p.kind === 'card')).toHaveLength(1)
  })

  it('puts Elior\'s own words first, after the command card, for "say … to …"', () => {
    const t = turn(say('Mira', 'Yes.'), { command: 'say hello to mira' })
    expect(kinds(t)).toEqual(['card', 'line:Elior', 'line:Mira'])
  })

  it('leaves the quotes with the narrator when nobody is addressed', () => {
    const t = turn(say('Mira', 'Hello.'), { addressed: undefined })
    expect(kinds(t)).toEqual(['card'])
  })

  it("puts Elior's own lines on the speech side even when nobody is addressed", () => {
    const t = turn(
      `The ink is smudged.\n${say('Elior', 'The storm.')}\n${say('Mira', 'Hello.')}`,
      { command: 'use journal', addressed: undefined },
    )
    expect(kinds(t)).toEqual(['card', 'line:Elior', 'card'])
  })

  it("leaves Elior's lines with the narrator when the turn leaves the room", () => {
    const t = turn(say('Elior', 'Onwards.'), {
      command: 'go north',
      addressed: undefined,
      description: { moved: true, firstVisit: false },
    })
    expect(kinds(t)).toEqual(['card'])
  })

  it('has no command card for a turn without a command', () => {
    const t = turn('The room.', { command: null, addressed: undefined })
    const pieces = columnPieces(t, parseTurn(t.text))
    expect(pieces).toEqual([
      expect.objectContaining({ kind: 'card', command: false, blocks: [0] }),
    ])
  })

  it('puts the chips on the card that names the item', () => {
    const t = turn(
      `You take the [item_name]key[/item_name].\n${say('Mira', 'Careful.')}\nShe waits.`,
      { gained: [{ kind: 'item', name: 'key', count: 1 }] },
    )
    const cards = columnPieces(t, parseTurn(t.text)).filter(
      (p) => p.kind === 'card',
    )
    expect(cards.map((c) => c.chips)).toEqual([true, false])
  })

  it('falls back to the last card for chips that no card names', () => {
    const t = turn(`Hm.\n${say('Mira', 'Careful.')}\nShe waits.`, {
      gained: [{ kind: 'item', name: 'lamp', count: 1 }],
    })
    const cards = columnPieces(t, parseTurn(t.text)).filter(
      (p) => p.kind === 'card',
    )
    expect(cards.map((c) => c.chips)).toEqual([false, true])
  })

  it('puts the news after the last spoken line, on a card of its own', () => {
    const t = turn(say('Mira', 'Hello.'), {
      quests: [
        {
          kind: 'started',
          name: 'Q',
          text: 't',
          main: false,
        } as unknown as NonNullable<Turn['quests']>[number],
      ],
    })
    const pieces = columnPieces(t, parseTurn(t.text))
    expect(pieces.at(-1)).toMatchObject({
      kind: 'card',
      news: true,
      blocks: [],
    })
  })

  it('tells the room of a look on the card, but not one told in the middle', () => {
    const arrival = {
      room: 'Cottage',
      description: 'Cosy.',
      characters: [],
      items: [],
      exits: {},
    }
    const look = turn('', {
      arrival,
      addressed: undefined,
      command: 'look',
    })
    expect(columnPieces(look, parseTurn(look.text))[0]).toMatchObject({
      arrival: true,
    })
    const walk = turn('', {
      arrival,
      addressed: undefined,
      command: 'go north',
      narrate: true,
      description: { moved: true, firstVisit: true } as Turn['description'],
    })
    expect(columnPieces(walk, parseTurn(walk.text))[0]).toMatchObject({
      arrival: false,
      command: true,
    })
  })
})
