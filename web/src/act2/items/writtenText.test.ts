/** Written text in Act II (traveler's journal, squire's diary) shows no raw asterisks (rq-vtk). */
import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from '../Act2'
import { FLAG_READ_SQUIRES_DIARY } from '../Act2StoryFlags'
import { SquiresDiary } from './SquiresDiary'
import { TravelersJournal } from './TravelersJournal'

/** The kind of every block of a turn, with dialogue marked by its speaker. */
function shape(raw: string): string[] {
  return parseTurn(raw).map((block) =>
    block.kind === 'dialogue' ? `dialogue:${block.speaker}` : block.kind,
  )
}

/** The text of every plain story line of a turn, markup stripped. */
function textLines(raw: string): string[] {
  return parseTurn(raw)
    .flatMap((block) => (block.kind === 'text' ? [block.markup] : []))
    .map((markup) => markup.replace(/\[\/?[a-z_]+\]/g, '').trim())
}

describe("Traveler's journal", () => {
  it('has well-formed markup', () => {
    const text = new TravelersJournal().use(new Game([new Act2()]).state)
    expect(findMarkupProblems(text)).toEqual([])
  })

  const raw = new TravelersJournal().use(new Game([new Act2()]).state)

  it('shows no literal asterisks', () => {
    expect(raw).not.toContain('*')
  })

  it('shows event, story line, three unlabelled quotes, event', () => {
    expect(shape(raw)).toEqual([
      'event',
      'text',
      'dialogue:null',
      'dialogue:null',
      'dialogue:null',
      'event',
    ])
  })

  it('keeps the single quote marks around each passage', () => {
    const quotes = parseTurn(raw).flatMap((block) =>
      block.kind === 'dialogue' ? [block.markup] : [],
    )
    expect(quotes[0]).toMatch(/^'The bloodline of Ravencrest .*magics\.'$/)
    expect(quotes[1]).toMatch(/^'I have documented .*great libraries\.'$/)
    expect(quotes[2]).toMatch(
      /^'Should any of my descendants .*inevitably will\.'$/,
    )
  })
})

describe("Squire's diary", () => {
  const raw = new SquiresDiary().use(new Game([new Act2()]).state)

  it('shows no literal asterisks', () => {
    expect(raw).not.toContain('*')
  })

  it('shows a heading line then an unlabelled quote, three times', () => {
    expect(shape(raw)).toEqual([
      'event',
      'text',
      'dialogue:null',
      'text',
      'dialogue:null',
      'text',
      'dialogue:null',
      'text',
      'event',
    ])
  })

  it('keeps the headings, colon included, in order', () => {
    expect(textLines(raw).slice(0, 3)).toEqual([
      'The morning after the king vanished:',
      'Some days later:',
      'Last entry:',
    ])
  })

  it('has well-formed markup', () => {
    expect(findMarkupProblems(raw)).toEqual([])
  })

  it('keeps the single quote marks around each entry', () => {
    const quotes = parseTurn(raw).flatMap((block) =>
      block.kind === 'dialogue' ? [block.markup] : [],
    )
    expect(quotes).toHaveLength(3)
    for (const quote of quotes) expect(quote).toMatch(/^'.*'$/)
  })

  it('sets the read flag and removes the diary from the room', () => {
    const game = new Game([new Act2()])
    const diary = new SquiresDiary()
    game.state.currentRoom.items.push(diary)
    diary.use(game.state)
    expect(game.state.getStoryFlag(FLAG_READ_SQUIRES_DIARY)).toBe(true)
    expect(game.state.currentRoom.items).not.toContain(diary)
  })

  it('keeps the success line before the closing event', () => {
    expect(raw).toContain('[success]The diary points to papers')
  })
})
